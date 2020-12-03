FROM node:12-stretch
LABEL description="Imagen de Debian para crear aplicaciones nativefier"

# Obtenga wine32, no 64, para solucionar la incompatibilidad binaria con rcedit.
# https://github.com/jiahaog/nativefier/issues/375#issuecomment-304247033
# Nos obligó a usar Debian en lugar de Alpine, que no hace multiarch.
RUN dpkg --add-architecture i386

# Instalar dependencias
RUN apt-get update \
    && apt-get --yes install wine32 imagemagick \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Agregar fuentes
COPY . /nativefier

# Construya nativefier y enlace globalmente
WORKDIR /nativefier/app
RUN npm install
WORKDIR /nativefier
RUN npm install && npm run build && npm link

# Utilice 1000 como usuario predeterminado, no root
USER 1000

# Ejecutar un {lin,mac,win} compilación: 1. para comprobar que la instalación se realizó correctamente
# 2. almacenar en caché los distribuibles de electron y evitar descargas en tiempo de ejecución.
RUN nativefier https://github.com/jiahaog/nativefier /tmp/nativefier \
    && nativefier -p osx https://github.com/jiahaog/nativefier /tmp/nativefier \
    && nativefier -p windows https://github.com/jiahaog/nativefier /tmp/nativefier \
    && rm -rf /tmp/nativefier

ENTRYPOINT ["nativefier"]
CMD ["--help"]
