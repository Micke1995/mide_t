from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("recibe_datos_medicion/", views.recibe_datos_medicion, name="recibe_datos_medicion"),
    path("crea_Sistema_medicion/", views.crea_Sistema_medicion, name="crea_Sistema_medicion"),
    path("crea_fase_sistema_med/", views.crea_fase_sistema_med, name="crea_fase_sistema_med"),
    path("lectura_nueva/", views.lectura_nueva, name="lectura_nueva"),
    path("get_lecturas/", views.get_lecturas, name="get_lecturas"),
    path("get_lecturas_historia/", views.get_lecturas_historia, name="get_lecturas_historia"),
    path("cambia_descripcion/", views.cambia_descripcion, name="cambia_descripcion"),
    path("get_servicios/", views.get_servicios, name="get_servicios"),

]
