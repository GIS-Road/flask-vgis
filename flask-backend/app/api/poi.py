"""
POI 数据接口。

Author:    gis_road
Version:   1.0.0
Date:      2026/10/19
"""

from flask import Blueprint, request, jsonify
from app.extentions import db
from app.common.response import ok,fail
from sqlalchemy import text

bp = Blueprint("poi",__name__)

# 允许做模糊匹配的字段白名单：列名写死在此，绝不来自用户输入，从根本上杜绝 SQL 注入
_LIKE_FIELDS = ("name", "type", "address", "cityname", "adname")

def _build_filters(src):
    """按白名单从 dict / MultiDict（需支持 .get）取参，返回 (filters, params)。
    列名是白名单常量、占位符 :field 也是常量，用户输入只作绑定值，安全。"""
    filters, params = [], {}
    for field in _LIKE_FIELDS:
        value = src.get(field)
        if value:
            filters.append(f"{field} LIKE :{field}")
            params[field] = f"%{value}%"
    return filters, params

@bp.route("/list", methods=["GET"])
def get_poi_list():
    try:
        page = int(request.args.get("page", 1))
        size = int(request.args.get("size", 20))
    except ValueError:
        return jsonify({"error": "page 和 size 必须是整数"}), 400

    if size > 500:
        size = 500
    if page < 1:
        page = 1
    offset = (page - 1) * size

    # ① 按字段白名单取参构建过滤条件（列名写死，杜绝注入）
    filters, params = _build_filters(request.args)

    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    # 全量开关：传 all 任意值（如 ?all=1）即不分页返回全部，可叠加过滤条件
    is_all = request.args.get("all") is not None

    # ② 总数（带同样条件）
    count_sql = text(f"SELECT COUNT(*) AS total FROM guizhou_ly {where}")
    total = db.session.execute(count_sql, params).fetchone().total

    # ③ 数据查询（带同样条件；显式列避免带出 geometry 二进制）
    if is_all:
        limit_clause = ""
    else:
        limit_clause = "LIMIT :size OFFSET :offset"
        params["size"] = size
        params["offset"] = offset

    data_sql = text(f"""
        SELECT ogc_fid, address, adname, adcode, cityname, name,
               lon_wgs84, lat_wgs84, type,
               AsGeoJSON(GEOMETRY, 6) AS geom_json
        FROM guizhou_ly
        {where}
        {limit_clause}
    """)
    raw = db.session.execute(data_sql, params).mappings()
    rows = [dict(r) for r in raw]

    total_pages = 1 if is_all else (total + size - 1) // size
    data = {
        "total": total,
        "pagination": {
            "page": page,
            "size": total if is_all else size,
            "total_pages": total_pages,
        },
        "rows": rows,
    }
    return ok(data)


@bp.route("/query", methods=["POST"])
def query_poi():
    # 前端传 JSON 对象，例如：
    # {"name":"鱼","type":"火锅","cityname":"黔东南","page":1,"size":20,"all":false}
    # 用 get_json(silent=True)：没传 body / 不是合法 JSON 时返回 None 而不是 415 报错
    payload = request.get_json(silent=True) or {}

    try:
        page = int(payload.get("page", 1) or 1)
        size = int(payload.get("size", 20) or 20)
    except (ValueError, TypeError):
        return jsonify({"error": "page 和 size 必须是整数"}), 400

    if size > 500:
        size = 500
    if page < 1:
        page = 1
    offset = (page - 1) * size

    # ① 按字段白名单取参构建过滤条件（列名写死，杜绝注入）
    filters, params = _build_filters(payload)

    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    # 对象里 all 为 true 即不分页返回全部，可叠加过滤条件
    is_all = bool(payload.get("all"))

    # ② 总数（带同样条件）
    count_sql = text(f"SELECT COUNT(*) AS total FROM guizhou_ly {where}")
    total = db.session.execute(count_sql, params).fetchone().total

    # ③ 数据查询（带同样条件；显式列避免带出 geometry 二进制）
    if is_all:
        limit_clause = ""
    else:
        limit_clause = "LIMIT :size OFFSET :offset"
        params["size"] = size
        params["offset"] = offset

    data_sql = text(f"""
        SELECT ogc_fid, address, adname, adcode, cityname, name,
               lon_wgs84, lat_wgs84, type,
               AsGeoJSON(GEOMETRY, 6) AS geom_json
        FROM guizhou_ly
        {where}
        {limit_clause}
    """)
    raw = db.session.execute(data_sql, params).mappings()
    rows = [dict(r) for r in raw]

    total_pages = 1 if is_all else (total + size - 1) // size
    data = {
        "total": total,
        "pagination": {
            "page": page,
            "size": total if is_all else size,
            "total_pages": total_pages,
        },
        "rows": rows,
    }
    return ok(data)