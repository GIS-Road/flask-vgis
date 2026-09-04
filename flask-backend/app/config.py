import os

class Config:
    SECRET_KEY = "dev-secret-key"
    # SQLite 连接串：sqlite:/// + 数据库文件路径（相对路径）
    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False