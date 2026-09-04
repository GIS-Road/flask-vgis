# 用户

from flask import Blueprint,render_template,request,session,redirect,url_for
from sqlalchemy.testing import fails

bp = Blueprint("user",__name__)

@bp.route("/add",methods=["POST"])
def add():
    #  返回 dict，就是前端 body 里的那个对象
    data = request.get_json()
    if not data:
        return fails("请求体不是合法json")
    username = data.get("username")
    email = data.get("email")
    # 成功和失败的统一处理情况
    return ({"received": data})
