import nmap
import uuid
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json
from contextlib import asynccontextmanager


ALVO           = "localhost"
INTERVALO_SCAN = 60
PORTAS_SENSIVEIS = {22, 23, 3389, 445, 135, 139, 5900, 1433, 3306, 5432}

snapshot_anterior = {}
historico_alertas = []
clientes_ws       = []


def fazer_scan():
    scanner = nmap.PortScanner()
    scanner.scan(hosts=ALVO, arguments="-sV")
    snapshot = {}

    for host in scanner.all_hosts():
        snapshot[host] = {"estado": scanner[host].state(), "portas": {}}
        for protocolo in scanner[host].all_protocols():
            for porta in scanner[host][protocolo].keys():
                servico = scanner[host][protocolo][porta]
                snapshot[host]["portas"][porta] = {
                    "estado":   servico["state"],
                    "servico":  servico["name"],
                }
    return snapshot


def gerar_alertas(anterior, atual):
    alertas = []
    agora = datetime.now().isoformat()

    def alerta(tipo, criticidade, host, descricao, porta=None, servico=None):
        return {
            "id":          str(uuid.uuid4()),
            "tipo":        tipo,
            "criticidade": criticidade,
            "host":        host,
            "porta":       porta,
            "servico":     servico,
            "descricao":   descricao,
            "timestamp":   agora,
        }


    for host in atual:
        if host not in anterior:
            alertas.append(alerta("novo_host", "alta", host,
                f"Novo host detectado: {host}"))


    for host in anterior:
        if host not in atual:
            alertas.append(alerta("host_perdido", "alta", host,
                f"Host parou de responder: {host}"))


    for host in atual:
        if host not in anterior:
            continue
        portas_antes = anterior[host]["portas"]
        portas_agora  = atual[host]["portas"]

        for porta in portas_agora:
            if porta not in portas_antes:
                critica = porta in PORTAS_SENSIVEIS
                alertas.append(alerta(
                    "porta_aberta",
                    "critica" if critica else "media",
                    host,
                    f"Porta aberta em {host}: {porta} ({portas_agora[porta]['servico']})",
                    porta, portas_agora[porta]["servico"]
                ))

        for porta in portas_antes:
            if porta not in portas_agora:
                alertas.append(alerta("porta_fechada", "baixa", host,
                    f"Porta fechada em {host}: {porta}", porta))

        for porta in portas_agora:
            if porta in portas_antes:
                antes  = portas_antes[porta]["servico"]
                depois = portas_agora[porta]["servico"]
                if antes != depois:
                    alertas.append(alerta("servico_alterado", "media", host,
                        f"Serviço alterado em {host}:{porta} ({antes} → {depois})",
                        porta, depois))

    return alertas


async def broadcast(alerta):
    msg = json.dumps(alerta)
    for ws in clientes_ws.copy():
        try:
            await ws.send_text(msg)
        except:
            clientes_ws.remove(ws)


async def loop_scan():
    global snapshot_anterior, historico_alertas
    while True:
        try:
            print("🔍 Rodando scan...")
            atual = await asyncio.to_thread(fazer_scan)
            if snapshot_anterior:
                novos = gerar_alertas(snapshot_anterior, atual)
                for a in novos:
                    historico_alertas.append(a)
                    await broadcast(a)
                print(f"✅ {len(novos)} alerta(s) gerado(s).")
            snapshot_anterior = atual
        except Exception as e:
            print(f"❌ Erro: {e}")
        await asyncio.sleep(INTERVALO_SCAN)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(loop_scan())
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"], allow_headers=["*"])

@app.get("/alertas")
def listar(criticidade: str = None, tipo: str = None):
    result = historico_alertas
    if criticidade: result = [a for a in result if a["criticidade"] == criticidade]
    if tipo:        result = [a for a in result if a["tipo"] == tipo]
    return result

@app.get("/snapshot")
def snapshot():
    return snapshot_anterior

@app.websocket("/ws/alertas")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clientes_ws.append(ws)
    try:
        while True: await ws.receive_text()
    except WebSocketDisconnect:
        clientes_ws.remove(ws)