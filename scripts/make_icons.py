from PIL import Image, ImageDraw
def icon(size, path, bg=(31,42,107), fg=(244,246,248), accent=(255,196,61)):
    S=size*4
    im=Image.new('RGBA',(S,S),bg+(255,))
    d=ImageDraw.Draw(im)
    r=S*0.11
    # hoja de respuestas: 4 filas x 4 burbujas, una rellena por fila
    cols=4; rows=4
    mx=S*0.2; my=S*0.2
    cw=(S-2*mx)/cols; ch=(S-2*my)/rows
    fill=[1,3,0,2]
    for i in range(rows):
        for j in range(cols):
            cx=mx+cw*(j+.5); cy=my+ch*(i+.5)
            rad=min(cw,ch)*0.3
            if fill[i]==j:
                d.ellipse([cx-rad,cy-rad,cx+rad,cy+rad],fill=accent)
            else:
                d.ellipse([cx-rad,cy-rad,cx+rad,cy+rad],outline=fg,width=int(S*0.012))
    im=im.resize((size,size),Image.LANCZOS)
    im.convert('RGB').save(path)
icon(192,'public/icon-192.png'); icon(512,'public/icon-512.png'); icon(180,'public/apple-touch-icon.png')
