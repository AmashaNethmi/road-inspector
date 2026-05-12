import asyncio
import motor.motor_asyncio
import sys

async def f():
    client = motor.motor_asyncio.AsyncIOMotorClient(
        'mongodb+srv://tcnbandara_db_user:lykiyZb45FYTj2gj@roadinspector.qzvo2u3.mongodb.net/',
        serverSelectionTimeoutMS=2000
    )
    try:
        info = await client.server_info()
        print("Connected successfully:", info.get('version'))
    except Exception as e:
        print("Failed to connect:", type(e).__name__, e)
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(f())
