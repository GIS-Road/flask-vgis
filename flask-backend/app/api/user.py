"""
用户接口（蓝图）

Author:    gis_road
Version:   1.0.0
Date:      2026/9/9
"""

from flask import Blueprint,render_template,request,session,redirect,url_for
from app.models.user.user import User
from app.extentions import db
from app.common.response import ok,fail

bp = Blueprint("user",__name__)

# 查询用户对象：单个
@bp.route("/<int:uid>",methods=["GET"])
def get_user_by_id(uid):
    user = User.query.get(uid)
    if not user:
        return fail("查询用户不存在")
    return ok(user.to_dict())

# 根据用户名进行查询
@bp.route("/<string:username>",methods=["GET"])
def get_user_by_username(username):
    # user = User.query.get(username)
    user = User.query.filter_by(username=username).first()
    if not user:
        return fail("查询用户不存在")
    return ok(user.to_dict())

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
        return fail("请求体不是合法json")
    username = data.get("username")
    email = data.get("email")
    db.session.add(data)
    db.session.commit()
    return ok({"data": data},"用户添加成功")

# 删除用户
@bp.route("/<int:uid>",methods=["DELETE"])
def delete(uid):
    user = User.query.get(uid)
    if not user:
        return fail("用户不存在")
    db.session.delete(user)
    db.session.commit()
    return ok("","用户删除成功")

# 修改用户信息
@bp.route("/<int:uid>",methods=["PUT"])
def update(uid):
    user = db.session.get(User, uid)
    if not user:
        return fail("用户不存在")
    data = request.get_json(silent=True) or {}
    print("data:",data)

    if "username" in data:
        username = (data["username"] or "").strip()
        if not username:
            return fail("用户名不能为空")
        user.username = username

    if "email" in data:
        user.email = (data["email"] or "").strip()

    if "phone" in data:
        user.phone = (data["phone"] or "").strip()

    if "password" in data:
        user.password =  data["password"] or ""
    db.session.commit()

    return ok("","用户信息修改成功")
