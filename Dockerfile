# Node.js 공식 이미지를 사용합니다.
FROM node:18

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# 필요한 패키지를 설치합니다.
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir /usr/share/fonts/nanumfont

RUN wget http://cdn.naver.com/naver/NanumFont/fontfiles/NanumFont_TTF_ALL.zip

RUN unzip NanumFont_TTF_ALL.zip -d /usr/share/fonts/nanumfont

RUN fc-cache -f -v

# 애플리케이션 의존성을 복사합니다.
COPY package*.json ./

# npm 패키지를 설치합니다.
RUN npm install

# 애플리케이션 소스 코드를 복사합니다.
COPY . .

# 애플리케이션을 실행합니다.
CMD ["npm", "start"]
