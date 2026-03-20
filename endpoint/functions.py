from .models import SistemaMedicion
import string

CHARS = string.digits + string.ascii_uppercase
BASE = len(CHARS)

def generate_qr_code(div='DF',version=1,id=None):
    if not id:
        ultimo_id = SistemaMedicion.objects.order_by('-id').values('id').first()["id"] + 1 if SistemaMedicion.objects.exists() else 0
    else:
        ultimo_id = id

    ultimo_id = number_to_code(ultimo_id).upper()
    qr_code = f"{div}{version}{ultimo_id }"

    return qr_code


def validate_code():

    for v in range(1000000):
        code = number_to_code(v)
        k = code_to_number(code)
        if v != k:
            print(f"Error: {v} != {k} (code: {code})")


def number_to_code(n, length=4):
    n -= 1

    result = []
    for _ in range(length):
        result.append(CHARS[n % BASE])
        n //= BASE

    return ''.join(reversed(result))

def code_to_number(code):
    n = 0
    for c in code:
        n = n * BASE + CHARS.index(c)
    return n + 1
