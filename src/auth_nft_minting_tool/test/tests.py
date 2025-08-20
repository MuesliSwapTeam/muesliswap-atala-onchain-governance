import pytest
import jwt
import urllib
import json
from hook.server import interaction_webhook
from hook.server import InteractionWebhookRequest, InteractionWebhookResponse
from hook.server import ActionParam, WebhookCredentialField, WebhookCredentialValuesDTO
from hook.server import User


@pytest.mark.asyncio
async def test_interaction_webhook():
    webhook_data = InteractionWebhookRequest(
        publicServiceDid="testPublicServiceDid",
        subscriberConnectDid="testSubscriberConnectDid",
        actionId="testActionId",
        actionInstanceId="testActionInstanceId",
        actionEventId="testActionEventId",
        actionParams=[
            ActionParam(name="name", value="value"),
        ],
        receivedCredentials=[
            WebhookCredentialValuesDTO(
                credentialId="testCredentialId",
                schemaId="testSchemaId",
                fields=[
                    WebhookCredentialField(name="name", value="value"),
                ],
            ),
            WebhookCredentialValuesDTO(
                credentialId="testCredentialId",
                schemaId="testSchemaId",
                fields=[
                    WebhookCredentialField(name="name", value="value"),
                ],
            ),
        ],
    )
    response = await interaction_webhook(webhook_data)
    assert isinstance(
        response, InteractionWebhookResponse
    ), "Response should be of type InteractionWebhookResponse"
    assert response.serviceDid == "testPublicServiceDid", "Service DIDs should match"
    assert (
        response.subscriberConnectDid == "testSubscriberConnectDid"
    ), "Subscriber DIDs should match"
    assert (
        response.actionEventId == "testActionEventId"
    ), "Action event IDs should match"
    assert response.issuedCredentials == [], "No credentials should be issued"


JWT_KEY = """
-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAM02J1ChYBxLhZD01iesq6eUnX7SeDRx
ffDg7fa/3aA/80HfHYjcAFkQriHdtIZQdn40IquxQnmUFfRgGx3yXIMCAwEAAQ==
-----END PUBLIC KEY-----
"""

example_tokens = {
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjE3MDk3MzgwNDcsImlhdCI6MTcwOTczNDQ0NywiY29ubmVjdERpZCI6IktTTTRRekI3c3NNa1htYnh6Nng5ZTIiLCJpc3MiOiI1RWdCeHhmNktkQVNXazlxN3JvbXpuIn0.NfDINw8waPCsQQNsgB-KCh6Bw21xtcQHx_vz-cYk-WzJ4DXhm8lKxSRnSq7LGa8vvzZTs2-z1aCkDFUJ070wtQ": {
        "exp": 1709738047,
        "iat": 1709734447,
        "connectDid": "KSM4QzB7ssMkXmbxz6x9e2",
        "iss": "5EgBxxf6KdASWk9q7romzn",
    }
}


def test_server_status_endpoint():
    for token, payload in example_tokens.items():
        decoded = jwt.decode(
            token, JWT_KEY, algorithms=["RS256"], options={"verify_exp": False}
        )
        assert decoded == payload, "Decoded token should match payload"

        # request status from localhost/status with bearer token as authorization header and check if it returns 200
        req = urllib.request.Request("http://localhost:6002/status")
        req.add_header("authorization", f"Bearer {token}")
        with urllib.request.urlopen(req) as response:
            r = json.load(response)
            print("RESPONSE", r)
            assert r["did"] == payload["connectDid"], "Connect DID should be the same"
            assert r["access_level"] == 1, "Access level should be 1"
            assert response.status == 200, "Status should be 200 OK"


example_user = {
    "bearer_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjE3MDk3MzgwNDcsImlhdCI6MTcwOTczNDQ0NywiY29ubmVjdERpZCI6IktTTTRRekI3c3NNa1htYnh6Nng5ZTIiLCJpc3MiOiI1RWdCeHhmNktkQVNXazlxN3JvbXpuIn0.NfDINw8waPCsQQNsgB-KCh6Bw21xtcQHx_vz-cYk-WzJ4DXhm8lKxSRnSq7LGa8vvzZTs2-z1aCkDFUJ070wtQ",
    "atala_did": "did:prism:20e5d4cebcadd8a14ddf4229c6106a9c9d881d5c69890d3da1c8d3bb4df5315c",
    "connect_did": "KSM4QzB7ssMkXmbxz6x9e2",
}


@pytest.mark.asyncio
async def test_full_authentication_flow():
    # call interaction webhook
    webhook_data = InteractionWebhookRequest(
        publicServiceDid="testPublicServiceDid",
        subscriberConnectDid=example_user["connect_did"],
        actionId="testActionId",
        actionInstanceId="testActionInstanceId",
        actionEventId="testActionEventId",
        actionParams=[
            ActionParam(name="name", value="value"),
        ],
        receivedCredentials=[
            WebhookCredentialValuesDTO(
                credentialId="testCredentialId",
                schemaId="testSchemaId",
                fields=[
                    WebhookCredentialField(
                        name="atala_did", value=example_user["atala_did"]
                    ),
                ],
            ),
        ],
    )
    response = await interaction_webhook(webhook_data)

    # check if user is in db
    res = User.get(User.connect_did == example_user["connect_did"])
    assert res.atala_did == example_user["atala_did"], "Atala DIDs should match"

    # request status from localhost/status with bearer token as authorization header and check if it returns 200
    req = urllib.request.Request("http://localhost:6002/status")
    req.add_header("authorization", f"Bearer {example_user['bearer_token']}")
    with urllib.request.urlopen(req) as response:
        r = json.load(response)
        assert r["did"] == example_user["connect_did"], "Connect DID should be the same"
        assert r["access_level"] == 1, "Access level should be 1"
        assert response.status == 200, "Status should be 200 OK"


if __name__ == "__main__":
    pytest.main(["test/tests.py", "-W", "ignore::pytest.PytestAssertRewriteWarning"])
