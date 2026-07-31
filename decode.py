import openlocationcode.openlocationcode as olc

ref_lat = 22.28
ref_lng = 86.72
short_code = "7PG9+CP"

try:
    full_code = olc.recoverNearest(short_code, ref_lat, ref_lng)
    coord = olc.decode(full_code)
    print(f"Coordinates: lat={coord.latitudeCenter}, lng={coord.longitudeCenter}")
except Exception as e:
    print("Error:", e)
