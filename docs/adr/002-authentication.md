# Authentication

## Contexto

El sistema original usa JWT y roles para varias capacidades de usuario.

## Decisión

Se diseña autenticacion con access token corto, refresh token rotado y sesiones persistidas con hash del refresh token.

## Alternativas consideradas

- Solo cookies de navegador
- Solo access token sin refresh
- sesion en memoria

## Consecuencias

- Compatible con Web, Mobile y Desktop.
- Permite revocacion y multiples dispositivos.
- Mantiene la API stateless en memoria de proceso.
