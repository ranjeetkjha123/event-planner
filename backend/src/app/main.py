"""FastAPI entry point for the Make My Marriage API scaffold."""

from fastapi import FastAPI

app = FastAPI(
    title="Make My Marriage API",
    version="0.1.0",
    description="API foundation. Product modules and persistence are not implemented yet.",
)


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    """Report that the API process is responding; this does not check dependencies."""
    return {"status": "ok"}
