# Node.js 공식 이미지를 사용합니다.
FROM node:18

# 작업 디렉토리를 설정합니다.
WORKDIR /app

# 애플리케이션 의존성을 복사합니다.
COPY package*.json ./

# npm 패키지를 설치합니다.
RUN npm install

# 애플리케이션 소스 코드를 복사합니다.
COPY . .

# 애플리케이션을 실행합니다.
CMD ["npm", "start"]
