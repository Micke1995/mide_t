import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from endpoint.models import *
import datetime
from django.utils.timezone import make_aware
from django.shortcuts import render
from .models import HistoricWebhook
import pandas as pd

GLOBAL_TOKEN = "9BlIIYdRPhHZsQHiADfpc3113AtTj2WCBK1kGDqJiR7YqmpfTgFZ7RkQu7rwS8LK"
MAX_BODY_SIZE = 10000

@csrf_exempt
def webhook_receiver(request):
    respuesta = {}

    if request.method == 'GET':
        info = list(HistoricWebhook.objects.order_by('-created_at').values('id','method','ip_address','created_at','body','response_status')[:50])
        for item in info:
            item['created_at'] = item['created_at'].strftime("%Y-%m-%d %H:%M:%S")
        respuesta["latest_mss"] = json.dumps(info)
        return render(request, 'views/webhook_index.html', respuesta)

    if request.method != 'POST':
        crear_registro(request,405)
        return JsonResponse({"error": "Metodo no permitido"}, status=405)

    token = request.headers.get('Authorization')
    if token != f"Bearer {GLOBAL_TOKEN}":
        respuesta["error"] = "No esta autorizado"
        crear_registro(request,401)
        return JsonResponse(respuesta, status=401)

    data = json.loads(request.body)

    event = data.get('evento')
    if event == 'lectura_nueva':
        crear_registro(request,200)
        respuesta =lectura_nueva(data)
        return respuesta
    else:
        crear_registro(request,200)
        return simple_answer(data)

def crear_registro(peticion, status):
    try:
        body = peticion.body.decode('utf-8')[:MAX_BODY_SIZE] if peticion.body else ""

        HistoricWebhook.objects.create(
            method=peticion.method,
            path=peticion.path,
            headers=dict(peticion.headers),
            query_params=dict(peticion.GET),
            body=body,
            ip_address=peticion.META.get('REMOTE_ADDR'),
            user_agent=peticion.META.get('HTTP_USER_AGENT'),
            content_type=peticion.content_type,
            request_size=len(peticion.body),
            response_status=status
        )
    except Exception:
        pass



def simple_answer(data):
    respuesta = {}

    respuesta['data'] = data
    respuesta['mensaje'] = "Evento recibido correctamente no realiza ninguna accion"

    return JsonResponse(respuesta,status=200)


def lectura_nueva(data):

    equipo_code = data.get("equipo_code")
    datos = data.get("datos", {})

    try:
        sistema = SistemaMedicion.objects.get(qr=equipo_code)
    except SistemaMedicion.DoesNotExist:
        return JsonResponse({"error": f"No se encontró un sistema de medición con el código '{equipo_code}'."}, status=404)

    tiempo = make_aware(datetime.datetime.now())
    for v in datos:
        if v:
            fase_id = Fase.objects.get_or_create(nombre=v['fase_id'], Sistema=sistema)
            v["fase_id"] = fase_id[0].id
            v["tiempo"] = make_aware(datetime.datetime.now())
            Lecturas.objects.create(**v)

    return JsonResponse({
        "mensaje": f"Se creó una lectura nueva para el sistema '{sistema.nombre}' de manera correcta en el momento {tiempo}"
    }, status=201)

