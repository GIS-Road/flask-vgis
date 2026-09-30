# 用户表结构
from app.extentions import db

class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer,primary_key=True)
    username = db.Column(db.String(80),unique=False,nullable=False)
    password = db.Column(db.String(255),unique=False,nullable=False)
    phone = db.Column(db.String(20),unique=False,nullable=True)
    email = db.Column(db.String(120),unique=False,nullable=True)

    def to_dict(self):
        return {
            "id":self.id,
            "username":self.username,
            "phone":self.phone,
            "email":self.email,
            # password 绝不返回给前端
        }