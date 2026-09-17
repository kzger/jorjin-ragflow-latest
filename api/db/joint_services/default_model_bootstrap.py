import json
import logging

# from api.db.db_models import DB
from api.db.services.tenant_model_instance_service import (
    TenantModelInstanceService,
)
from api.db.services.tenant_model_provider_service import (
    TenantModelProviderService,
)
from api.db.services.tenant_model_service import TenantModelService
from common import settings
from common.constants import LLMType


logger = logging.getLogger(__name__)


def _split_model_name(model_name: str) -> tuple[str, str, str]:
    """
    Parse:
        model@instance@provider

    Example:
        BAAI/bge-m3@embed@OpenAI-API-Compatible

    Returns:
        (
            "BAAI/bge-m3",
            "embed",
            "OpenAI-API-Compatible",
        )
    """
    if not model_name:
        return "", "", ""

    parts = model_name.rsplit("@", 2)

    if len(parts) == 3:
        return parts[0], parts[1], parts[2]

    if len(parts) == 2:
        return parts[0], "default", parts[1]

    return parts[0], "default", ""


def _ensure_provider(
    tenant_id: str,
    provider_name: str,
):
    provider = (
        TenantModelProviderService
        .get_by_tenant_id_and_provider_name(
            tenant_id,
            provider_name,
        )
    )

    if provider:
        return provider

    TenantModelProviderService.insert(
        tenant_id=tenant_id,
        provider_name=provider_name,
    )

    provider = (
        TenantModelProviderService
        .get_by_tenant_id_and_provider_name(
            tenant_id,
            provider_name,
        )
    )

    if not provider:
        raise RuntimeError(
            f"Failed to create provider "
            f"{provider_name} for tenant {tenant_id}"
        )

    logger.info(
        "Created default model provider: "
        "tenant=%s provider=%s",
        tenant_id,
        provider_name,
    )

    return provider


def _ensure_instance(
    provider,
    instance_name: str,
    api_key: str,
    base_url: str,
):
    instance = (
        TenantModelInstanceService
        .get_by_provider_id_and_instance_name(
            provider.id,
            instance_name,
        )
    )

    if instance:
        return instance

    extra = {
        "base_url": base_url or "",
        "region": "default",
    }

    TenantModelInstanceService.create_instance(
        provider_id=provider.id,
        instance_name=instance_name,
        api_key=api_key or "",
        extra=json.dumps(extra),
    )

    instance = (
        TenantModelInstanceService
        .get_by_provider_id_and_instance_name(
            provider.id,
            instance_name,
        )
    )

    if not instance:
        raise RuntimeError(
            f"Failed to create model instance "
            f"{instance_name}"
        )

    logger.info(
        "Created default model instance: "
        "provider=%s instance=%s base_url=%s",
        provider.provider_name,
        instance_name,
        base_url,
    )

    return instance


def _ensure_model(
    provider,
    instance,
    model_name: str,
    model_type: str,
):
    model = (
        TenantModelService
        .get_by_provider_id_and_instance_id_and_model_type_and_model_name(
            provider.id,
            instance.id,
            model_type,
            model_name,
        )
    )

    if model:
        return model

    TenantModelService.insert(
        provider_id=provider.id,
        instance_id=instance.id,
        model_name=model_name,
        model_type=model_type,
        extra=json.dumps({}),
    )

    model = (
        TenantModelService
        .get_by_provider_id_and_instance_id_and_model_type_and_model_name(
            provider.id,
            instance.id,
            model_type,
            model_name,
        )
    )

    if not model:
        raise RuntimeError(
            f"Failed to create model "
            f"{model_name} ({model_type})"
        )

    logger.info(
        "Created default model: "
        "provider=%s instance=%s model=%s type=%s",
        provider.provider_name,
        instance.instance_name,
        model_name,
        model_type,
    )

    return model


def _ensure_default_model(
    tenant_id: str,
    model_type: str,
    config: dict,
):
    if not config:
        return

    configured_model = config.get("model")

    if not configured_model:
        return

    model_name, instance_name, provider_from_name = (
        _split_model_name(configured_model)
    )

    provider_name = (
        config.get("factory")
        or provider_from_name
    )

    if not provider_name:
        raise ValueError(
            f"No provider/factory configured for "
            f"default model {configured_model}"
        )

    if (
        provider_from_name
        and provider_from_name != provider_name
    ):
        raise ValueError(
            "Provider mismatch in default model config: "
            f"model={configured_model}, "
            f"factory={provider_name}"
        )

    if not instance_name:
        instance_name = model_type

    api_key = config.get("api_key", "")
    base_url = config.get("base_url", "")

    provider = _ensure_provider(
        tenant_id,
        provider_name,
    )

    instance = _ensure_instance(
        provider,
        instance_name,
        api_key,
        base_url,
    )

    _ensure_model(
        provider,
        instance,
        model_name,
        model_type,
    )


def initialize_default_model_providers(
    tenant_id: str,
) -> None:
    default_models = [
        (
            LLMType.CHAT.value,
            settings.CHAT_CFG,
        ),
        (
            LLMType.EMBEDDING.value,
            settings.EMBEDDING_CFG,
        ),
        (
            LLMType.RERANK.value,
            settings.RERANK_CFG,
        ),
        (
            LLMType.SPEECH2TEXT.value,
            settings.ASR_CFG,
        ),
        (
            LLMType.IMAGE2TEXT.value,
            settings.IMAGE2TEXT_CFG,
        ),
    ]

    logger.info(
        "Initializing default model providers for tenant=%s",
        tenant_id,
    )

    for model_type, config in default_models:
        try:
            _ensure_default_model(
                tenant_id,
                model_type,
                config,
            )
        except Exception:
            logger.exception(
                "Failed to initialize default model: "
                "tenant=%s type=%s config=%s",
                tenant_id,
                model_type,
                {
                    "model": config.get("model") if config else None,
                    "factory": config.get("factory") if config else None,
                    "base_url": config.get("base_url") if config else None,
                },
            )
            raise

    logger.info(
        "Default model providers initialized for tenant=%s",
        tenant_id,
    )