# 用户蓝图
from flask import Blueprint,render_template,request,session,redirect,url_for
from app.models.user.user import User
from app.extentions import db

bp = Blueprint("user",__name__)

# 查询用户对象：单个
@bp.route("/<int:uid>",methods=["GET"])
def get_user(uid):
    user = User.query.get(uid)
    if not user:
        return "查询用户不存在"
    return user

# 查询用户列表
@bp.route("/list",methods=["GET"])
def get_user_list():
    page = request.args.get("page",1,type=int)
    size = request.args.get("size", 10, type=int)
    keyword = request.args.get("keyword","")

    query = User.query()
    if keyword:
        query = query.filter(User.username.like(f"%{keyword}%"))
    pagination = query.paginate(page=page,per_page=size,error_out=False)

    return pagination.items


# 新增用户
@bp.route("/add",methods=["POST"])
def add():
    #  返回 dict，就是前端 body 里的那个对象
    data = request.get_json()
    if not data:
        return ("请求体不是合法json")
    username = data.get("username")
    email = data.get("email")
    db.session.add(data)
    db.session.commit()
    # 成功和失败的统一处理情况
    return ({"received": data})

# 删除用户
@bp.route("/<int:uid>",methods=["DELETE"])
def delete(uid):
    user = User.query.get(uid)
    if not user:
        return "用户不存在！"
    db.session.delete(user)
    db.session.commit()
    return "删除成功"

# 修改用户
@bp.route("/<int:uid>",methods=["PUT"])
def update(uid):
    user = User.query.get(uid)
    if not user:
        return "用户不存在！"
    data = request.get_json() or {}

    if "username" in data:
        user["username"] = data["username"]
    if "email" in data:
        user["email"] = data["email"]

    db.session.commit()

    return "修改成功"
