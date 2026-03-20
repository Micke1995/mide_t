import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from endpoint.models import *
import datetime
from django.utils.timezone import make_aware


GLOBAL_TOKEN = "9BlIIYdRPhHZsQHiADfpc3113AtTj2WCBK1kGDqJiR7YqmpfTgFZ7RkQu7rwS8LK"

@csrf_exempt
def webhook_receiver(request):
    respuesta = {}
    if request.method != 'POST':
        return JsonResponse({"error": "Metodo no permitido"}, status=405)

    token = request.headers.get('Authorization')
    if token != f"Bearer {GLOBAL_TOKEN}":
        respuesta["error"] = "No esta autorizado"
        return JsonResponse(respuesta, status=401)

    data = json.loads(request.body)

    event = data.get('evento')
    if event == 'lectura_nueva':
        respuesta =lectura_nueva(data)
        return respuesta
    else:
        return simple_answer(data)


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

