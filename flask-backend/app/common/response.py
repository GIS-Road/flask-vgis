"""
接口响应成功和失败公共处理方法

Author:    gis_road
Version:   1.0.0
Date:      2026/9/9
"""

from flask import jsonify

def ok(data=None,msg="success"):
    return jsonify({"code":200,"msg":msg,"data":data})

def fail(msg="error",code=500):
    return jsonify({"code": code, "msg": msg, "data": None})

