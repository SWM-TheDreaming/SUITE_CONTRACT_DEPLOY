# Smart Contract Semi-Automatic Deployer

## Purpose

HardHat을 사용한 스마트 컨트랙트 배포와 테스트를 cli로 진행해주기 위한 레포지토리
|application|version |
|--|--|
| node.js | v18.16.0 |
| hardhat | v2.17.1 |

## Init - Reference

[HardHat- 컨트랙트 배포](https://velog.io/@lopahn2/HardHat-%EC%BB%A8%ED%8A%B8%EB%9E%99%ED%8A%B8-%EB%B0%B0%ED%8F%AC#contract-compile)

## Step

### Step1

```git
git init
git clone https://github.com/SWM-TheDreaming/SUITE_CONTRACT_DEPLOY.git
```

```shell
mkdir contracts
mv .env-mock .env
```

### Step2

```shell
npm i
```

#### MYSQL

```sql
CREATE  DATABASE  SUITE_CONTRACT  default  character  set utf8 collate utf8_general_ci;

CREATE  TABLE  CONTRACT_INFO (

id INT AUTO_INCREMENT PRIMARY KEY,

contract_id INT  NOT NULL,

contract_factory_name VARCHAR(255) NOT NULL,

contract_address VARCHAR(255) NOT NULL,

contractABI JSON  NOT NULL

);

CREATE  USER '<INPUT YOUR DBID>'@'localhost' IDENTIFIED BY  '<INPUT YOUR PASSWORD>';

GRANT ALL PRIVILEGES ON  *.*  TO  '<INPUT YOUR DBID>'@'localhost';

FLUSH PRIVILEGES;
```

#### Fill Out `.env`

### Step3

#### Compile / Test / Deploy

```shell
npx hardhat compile --network <what-you-want>
npx hardhat test
npx hardhat run scripts/deploy.js --network <what-you-want>
```

## Next?

레포지토리에서 사용된 DB에 저장된 스마트컨트랙트의 주소를 가지고 컨트랙트에 트랜젝션을 날려주는 API 서버에서 활용하자. ( Main Branch )
