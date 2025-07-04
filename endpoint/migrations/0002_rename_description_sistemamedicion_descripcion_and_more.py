# Generated by Django 5.1.4 on 2025-05-20 19:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("endpoint", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="sistemamedicion",
            old_name="description",
            new_name="descripcion",
        ),
        migrations.RenameField(
            model_name="sistemamedicion",
            old_name="location",
            new_name="ubicacion",
        ),
        migrations.AddField(
            model_name="sistemamedicion",
            name="latitude",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="sistemamedicion",
            name="longitude",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
