import os
def get_secret(secret_id,backup=None):
    return os.getenv(secret_id,backup)


# print(os.getenv('PIPELINE'))
if get_secret('PIPELINE') == 'production':
    from .local import *
    print('Se inicia el sistema en modo local')
else:
    from .production import *
    print('Se inicia el sistema en modo produccion')
    

