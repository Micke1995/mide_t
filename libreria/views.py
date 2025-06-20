from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from endpoint.models import *
from django.http import JsonResponse


def index(request):
    
    sis_name = "Zona Morelia Centro"
    try:
        sistema = SistemaMedicion.objects.get(nombre=sis_name)
    except SistemaMedicion.DoesNotExist:
        return JsonResponse({"error": f"Sistema '{sis_name}' no encontrado"}, status=404)
    
    context = {'sistema':sistema}
    return render(request, f'views/inicio.html',context)