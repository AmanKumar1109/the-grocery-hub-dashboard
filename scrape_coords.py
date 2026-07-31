import urllib.request
import re

url = 'https://www.google.com/maps/place/THE+GROCERY+HUB,+Dadu+Complex,+near+Shitla+Mandir,+Baharagora,+Jharkhand+832101/data=!4m2!3m1!1s0x3a1d973aa3253b5f:0xf5d22ddb2d163977!18m1!1e1'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    m = re.search(r'meta content=".*?center=([\d.-]+)%2C([\d.-]+)', html)
    if m:
        print("Center:", m.group(1), m.group(2))
    else:
        # Search for any string like 22.2XXXX, 86.7XXXX
        m2 = re.findall(r'\[(22\.\d+),(86\.\d+)\]', html)
        print("Fallback:", m2)
        m3 = re.findall(r'(22\.\d+),(86\.\d+)', html)
        if m3:
            print("General search:", set(m3))
except Exception as e:
    print(e)
