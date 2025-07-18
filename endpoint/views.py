from django.http import HttpResponse
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import *
import datetime
from django.utils.timezone import make_aware
import pandas as pd
def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")



@csrf_exempt
@require_http_methods(["POST"])
def recibe_datos_medicion(request):
    try:
        data = json.loads(request.body)
        desde = data.get('desde')
        hasta = data.get('hasta')

        return JsonResponse({
            "mensaje": f"Recibido desde {desde} hasta {hasta}"
        }, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    

@csrf_exempt
@require_http_methods(["POST"])
def crea_Sistema_medicion(request):
    try:
        data = json.loads(request.body)

        nombre = data.get('nombre')
        lugar = data.get('lugar', '')  
        descripcion = data.get('descripcion', '')
        latitud = data.get('latitud')
        longitud = data.get('longitud')

        # if not nombre:
        #     return JsonResponse({"error": "El campo 'nombre' es obligatorio."}, status=400)

        # if latitud is None or longitud is None:
        #     return JsonResponse({"error": "Los campos 'latitud' y 'longitud' son obligatorios."}, status=400)

        if SistemaMedicion.objects.filter(nombre=nombre).exists():
            return JsonResponse({
                "error": f"Ya existe un sistema con el nombre '{nombre}'."
            }, status=400)

        sistema = SistemaMedicion.objects.create(
            nombre=nombre,
            ubicacion=lugar,
            descripcion=descripcion,
            latitud=latitud,
            longitud=longitud,
        )

        return JsonResponse({
            "mensaje": f"Se creó el sistema '{nombre}' correctamente.",
            "sistema_id": sistema.id
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Error interno: {str(e)}"}, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def crea_fase_sistema_med(request):
    try:
        data = json.loads(request.body)

        sis_name = data.get('sistema')
        fase_nombre = data.get('fase')

        if not sis_name or not fase_nombre:
            return JsonResponse({"error": "Faltan datos obligatorios"}, status=400)

        try:
            sistema = SistemaMedicion.objects.get(nombre=sis_name)
        except SistemaMedicion.DoesNotExist:
            return JsonResponse({"error": f"Sistema '{sis_name}' no encontrado"}, status=404)

        if Fase.objects.filter(Sistema=sistema, nombre=fase_nombre).exists():
            return JsonResponse({
                "error": f"La fase '{fase_nombre}' ya existe para el sistema '{sis_name}'"
            }, status=400)

        Fase.objects.create(Sistema=sistema, nombre=fase_nombre)

        return JsonResponse({
            "mensaje": f"Se creó la fase '{fase_nombre}' para el sistema '{sis_name}' correctamente"
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Error interno: {str(e)}"}, status=500)
    

@csrf_exempt
@require_http_methods(["POST"])
def lectura_nueva(request):
    try:
        data = json.loads(request.body)
        sis_name = data.get('sistema',"Zona Morelia Centro")
        fase = data.get('fase','A')
        voltaje = data.get('voltaje',0)
        corriente = data.get('corriente',0)
        angulo = data.get('angulo',0)
        kwh = data.get('kwh',0)

        try:
            sistema = SistemaMedicion.objects.get(nombre=sis_name)
        except SistemaMedicion.DoesNotExist:
            return JsonResponse({"error": f"Sistema '{sis_name}' no encontrado"}, status=404)
        
        fase_obj = Fase.objects.get_or_create(Sistema=sistema, nombre=fase)[0]

        tiempo = make_aware(datetime.datetime.now())
        Lecturas.objects.create(
            fase = fase_obj,
            tiempo = tiempo,
            voltaje=voltaje,
            corriente=corriente,
            angulo=angulo,
            kwh=kwh
        )
        return JsonResponse({
            "mensaje": f"Se creó una lectura nueva para la '{fase}' del sistema '{sis_name}' de manera correcta en el momento {tiempo}"
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Error interno: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"]) 
def get_lecturas(request):

    sis_name = request.GET.get('sistema')
    sistema = SistemaMedicion.objects.get(nombre=sis_name) 

    fases = ['A', 'B', 'C', 'N']
    latest_lecturas = {}

    for nombre_fase in fases:
        try:
            fase_obj = Fase.objects.get(Sistema=sistema, nombre=nombre_fase)
            lectura = Lecturas.objects.filter(fase=fase_obj).order_by('-tiempo').first()
            if lectura:
                latest_lecturas[nombre_fase] = {
                    "voltaje": lectura.voltaje,
                    "corriente": lectura.corriente,
                    "angulo": lectura.angulo,
                    "kwh": lectura.kwh,
                    "tiempo": lectura.tiempo,
                }
        except Fase.DoesNotExist:
            latest_lecturas[nombre_fase] = None

    return JsonResponse({"datos": latest_lecturas}, status=200)


@csrf_exempt
@require_http_methods(["GET"]) 
def get_lecturas_historia(request):

    sis_name = request.GET.get('sistema')
    sistema = SistemaMedicion.objects.get(nombre=sis_name) 

    fases = ['A', 'B', 'C', 'N']
    lecturas_historial = {}

    for nombre_fase in fases:
        lecturas_historial[nombre_fase] = []
        try:
            fase_obj = Fase.objects.get(Sistema=sistema, nombre=nombre_fase)
            lecturas = Lecturas.objects.filter(fase=fase_obj).order_by('-tiempo').all()

            for lectura in lecturas:
                if lectura:
                    lecturas_historial[nombre_fase] += [{
                        "voltaje": lectura.voltaje,
                        "corriente": lectura.corriente,
                        "angulo": lectura.angulo,
                        "kwh": lectura.kwh,
                        "tiempo": lectura.tiempo,
                    }]
        except Fase.DoesNotExist:
            lecturas_historial= []
    # lecturas_historial = json.dumps(lecturas_historial)
    return JsonResponse({"datos": lecturas_historial}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def cambia_descripcion(request):
    try:
        data = json.loads(request.body)
        sis_name = data.get('sistema',"Zona Morelia Centro")
        descripcio_nueva = data.get('descripcion',"Sin Descripcion")


        try:
            sistema = SistemaMedicion.objects.get(nombre=sis_name)
            sistema.descripcion = descripcio_nueva
            sistema.save()
        except SistemaMedicion.DoesNotExist:
            return JsonResponse({"error": f"Sistema '{sis_name}' no encontrado"}, status=404)
        

        return JsonResponse({
            "mensaje": f"Se cambio la descripcion  del sistema '{sis_name}' de manera correcta."
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Error interno: {str(e)}"}, status=500)

