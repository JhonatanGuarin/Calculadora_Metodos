from fastapi import APIRouter, HTTPException, Request
import httpx
from ..config import settings
import json

router = APIRouter()

@router.post("/metodos/punto-fijo")
async def punto_fijo_route(request: Request):
    """
    Ruta para el método de punto fijo.
    Reenvía la solicitud al microservicio correspondiente.
    """
    try:
        # Obtener el cuerpo de la solicitud
        body = await request.json()

        # Reenviar la solicitud al microservicio de punto fijo
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.punto_fijo_service_url}/solve",
                json=body,
                timeout=30.0
            )

            # Devolver la respuesta del microservicio
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de servicio: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/metodos/biseccion")
async def biseccion_route(request: Request):
    """
    Ruta para el método de bisección.
    Reenvía la solicitud al microservicio correspondiente.
    """
    try:
        # Obtener el cuerpo de la solicitud
        body = await request.json()

        # Reenviar la solicitud al microservicio de bisección
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.biseccion_service_url}/solve",
                json=body,
                timeout=30.0
            )

            # Devolver la respuesta del microservicio
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de servicio: {str(e)}")
    except httpx.HTTPStatusError as e:
        # Capturar errores HTTP del microservicio y reenviarlos
        error_detail = "Error desconocido"
        try:
            error_response = e.response.json()
            if "detail" in error_response:
                error_detail = error_response["detail"]
        except:
            error_detail = str(e)

        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/metodos/newton-raphson")
async def newton_raphson_route(request: Request):
    """
    Ruta para el método de Newton-Raphson.
    Reenvía la solicitud al microservicio correspondiente.
    """
    try:
        # Obtener el cuerpo de la solicitud
        body = await request.json()

        # Reenviar la solicitud al microservicio de Newton-Raphson
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.newton_raphson_service_url}/solve",
                json=body,
                timeout=30.0
            )

            # Devolver la respuesta del microservicio
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de servicio: {str(e)}")
    except httpx.HTTPStatusError as e:
        # Capturar errores HTTP del microservicio y reenviarlos
        error_detail = "Error desconocido"
        try:
            error_response = e.response.json()
            if "detail" in error_response:
                error_detail = error_response["detail"]
        except:
            error_detail = str(e)

        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/metodos/secante")
async def secante_route(request: Request):
    """
    Ruta para el método de la Secante.
    Reenvía la solicitud al microservicio correspondiente.
    """
    try:
        # Obtener el cuerpo de la solicitud
        body = await request.json()

        # Reenviar la solicitud al microservicio de Secante
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.secante_service_url}/solve",
                json=body,
                timeout=30.0
            )

            # Devolver la respuesta del microservicio
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de servicio: {str(e)}")
    except httpx.HTTPStatusError as e:
        # Capturar errores HTTP del microservicio y reenviarlos
        error_detail = "Error desconocido"
        try:
            error_response = e.response.json()
            if "detail" in error_response:
                error_detail = error_response["detail"]
        except:
            error_detail = str(e)

        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    

@router.post("/metodos/jacobi")
async def jacobi_route(request: Request):
    """
    Ruta para el método de Jacobi.
    Reenvía la solicitud al microservicio correspondiente.
    """
    try:
        # Obtener el cuerpo de la solicitud
        body = await request.json()

        # Reenviar la solicitud al microservicio de Jacobi
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.jacobi_service_url}/solve",
                json=body,
                timeout=30.0
            )

            # Devolver la respuesta del microservicio
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de servicio: {str(e)}")
    except httpx.HTTPStatusError as e:
        # Capturar errores HTTP del microservicio y reenviarlos
        error_detail = "Error desconocido"
        try:
            error_response = e.response.json()
            if "detail" in error_response:
                error_detail = error_response["detail"]
        except:
            error_detail = str(e)

        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# Agregar esta función después de la ruta de Jacobi

@router.post("/metodos/gauss-seidel")
async def gauss_seidel_route(request: Request):
    """
    Ruta para el método de Gauss-Seidel.
    Reenvía la solicitud al microservicio correspondiente.
    """
    try:
        # Obtener el cuerpo de la solicitud
        body = await request.json()

        # Reenviar la solicitud al microservicio de Gauss-Seidel
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.gauss_seidel_service_url}/solve",
                json=body,
                timeout=30.0
            )

            # Devolver la respuesta del microservicio
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de servicio: {str(e)}")
    except httpx.HTTPStatusError as e:
        # Capturar errores HTTP del microservicio y reenviarlos
        error_detail = "Error desconocido"
        try:
            error_response = e.response.json()
            if "detail" in error_response:
                error_detail = error_response["detail"]
        except:
            error_detail = str(e)

        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Verificar el estado de salud de todos los microservicios
    """
    health_status = {"api_gateway": "healthy", "services": {}}

    async with httpx.AsyncClient() as client:
        try:
            # Verificar el servicio de punto fijo
            response = await client.get(
                f"{settings.punto_fijo_service_url}/",
                timeout=5.0
            )
            health_status["services"]["punto_fijo"] = (
                "healthy" if response.status_code == 200 else "unhealthy"
            )
        except:
            health_status["services"]["punto_fijo"] = "unreachable"

        try:
            # Verificar el servicio de bisección
            response = await client.get(
                f"{settings.biseccion_service_url}/",  
                timeout=5.0
            )
            health_status["services"]["biseccion"] = (
                "healthy" if response.status_code == 200 else "unhealthy"
            )
        except:
            health_status["services"]["biseccion"] = "unreachable"

        try:
            # Verificar el servicio de Newton-Raphson
            response = await client.get(
                f"{settings.newton_raphson_service_url}/",  
                timeout=5.0
            )
            health_status["services"]["newton_raphson"] = (
                "healthy" if response.status_code == 200 else "unhealthy"
            )
        except:
            health_status["services"]["newton_raphson"] = "unreachable"

        try:
            # Verificar el servicio de Secante
            response = await client.get(
                f"{settings.secante_service_url}/",  
                timeout=5.0
            )
            health_status["services"]["secante"] = (
                "healthy" if response.status_code == 200 else "unhealthy"
            )
        except:
            health_status["services"]["secante"] = "unreachable"

        try:
            # Verificar el servicio de Jacobi
            response = await client.get(
                f"{settings.jacobi_service_url}/",  
                timeout=5.0
            )
            health_status["services"]["jacobi"] = (
                "healthy" if response.status_code == 200 else "unhealthy"
            )
        except:
            health_status["services"]["jacobi"] = "unreachable"

        try:
            # Verificar el servicio de Gauss-Seidel
            response = await client.get(
                f"{settings.gauss_seidel_service_url}/",
                timeout=5.0
            )
            health_status["services"]["gauss_seidel"] = (
                "healthy" if response.status_code == 200 else "unhealthy"
            )
        except:
            health_status["services"]["gauss_seidel"] = "unreachable"

    return health_status