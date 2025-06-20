from django.db import models


class SistemaMedicion(models.Model):
    nombre = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=255, blank=True)
    descripcion = models.TextField(blank=True)

    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.nombre


class Fase(models.Model):
    PHASE_CHOICES = [
        ('A', 'Fase A'),
        ('B', 'Fase B'),
        ('C', 'Fase C'),
        ('N', 'Fase N')
    ]

    Sistema = models.ForeignKey(SistemaMedicion, on_delete=models.CASCADE, related_name='phases')
    nombre = models.CharField(max_length=1, choices=PHASE_CHOICES)

    class Meta:
        unique_together = ('Sistema', 'nombre')

    def __str__(self):
        return f"{self.Sistema.nombre} - Fase {self.nombre}"


class Lecturas(models.Model):
    fase = models.ForeignKey(Fase, on_delete=models.CASCADE, related_name='Lecturas')
    tiempo = models.DateTimeField(db_index=True)

    voltaje = models.FloatField()
    corriente = models.FloatField()
    angulo = models.FloatField()
    kwh = models.FloatField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['fase', 'tiempo']),
        ]
        ordering = ['-tiempo']

    def __str__(self):
        return f"{self.fase} @ {self.tiempo}"