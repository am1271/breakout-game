// dohvacanje canvasa i konteksta
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

//loptica i palica
const INITIAL_BALL_SPEED = 5;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 8;
const PADDLE_BOTTOM_OFFSET = 20;

//cigle
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 10;
const BRICK_PADDING = 4;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 30;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_COLORS = [
    'rgb(153, 51, 0)',
    'rgb(255, 0, 0)',
    'rgb(255, 153, 204)',
    'rgb(0, 255, 0)',
    'rgb(255, 255, 153)'
];

//varijable za igru
let paddleX;    //x koordinata lijevo ruba palice
let ballX;      //x i y koordinate loptice
let ballY;  
let dx;         //brzina loptice po x i y
let dy;
let score = 0;      //trenutni broj bodova
let highScore;      //najbolji rezultat do sad
let gameStatus = 'START';   //stanje igre (START, PLAYING, GAME_OVER, WIN)
let rightPressed = false;   //desna tipka 
let leftPressed = false;    //lijeva tipka
let bricks = [];            //status cigli

//dohvacanje najboljeg rez iz localStoragea ako postoji 
highScore = localStorage.getItem('breakoutHighScore') ? parseInt(localStorage.getItem('breakoutHighScore')) : 0;

//FUNKCIJE ZA CRTANJE IGRE

//postavljanje sjene za simulaciju 3D efekta 
function setShadow(color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 3;  //pomak sjene udesno
    ctx.shadowOffsetY = 3;  //pomak sjene dolje
}

//uklanjanje sjene
function clearShadow() {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

//crtanje pravokutnika s 3D efektom 
function drawRectWith3D(x, y, w, h, color) {
    setShadow('rgba(0, 0, 0, 0.9)', 6); //tamna sjena
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);   //glavni pravokutnik
    clearShadow();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';   // svjetliji rub
    ctx.strokeRect(x, y, w, h);
}

//crtanje aktivnih cigli 
function drawBricks() {
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                drawRectWith3D(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, BRICK_COLORS[r]);
            }
        }
    }
}

//crtanje palice na dnu
function drawPaddle() {
    const paddleY = CANVAS_HEIGHT - PADDLE_HEIGHT - PADDLE_BOTTOM_OFFSET;
    drawRectWith3D(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT, '#CCCCCC');
}

//crtanje loptice 
function drawBall() {
    drawRectWith3D(ballX, ballY, BALL_SIZE, BALL_SIZE, '#F0F0F0');
}

//trenutni i maksimalni broj bodova 
function drawScore() {
    ctx.font = 'bold 16px "Verdana", Helvetica';
    ctx.fillStyle = 'white';
    //trenutni bodovi - gore lijevo
    ctx.textAlign = 'start';
    ctx.fillText("BODOVI: " + score, 10, 25);
    //maksimalni bodovi - gore desno
    ctx.textAlign = 'end';
    ctx.fillText("MAKSIMALNI: " + highScore, CANVAS_WIDTH - 10, 25);
}

//poruke o statusu igre 
function drawStatusText() {
    ctx.textAlign = 'center';
    setShadow('rgba(0, 0, 0, 1)', 10);

    //glavni tekst 
    ctx.font = 'bold 36px "Verdana", Helvetica';
    ctx.fillStyle = 'white';
    ctx.fillText("BREAKOUT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    let subText = '';
    let subColor = 'white';
    let subFont = '';

    if (gameStatus === 'START') {
        subText = "Pritisni SPACE za početak";
        subFont = 'bold italic 18px "Verdana", Helvetica';
    } else if (gameStatus === 'GAME_OVER') {
        subText = "GAME OVER";
        subColor = 'yellow';
        subFont = 'bold 40px "Verdana", Helvetica';
    } else if (gameStatus === 'WIN') {
        subText = "POBJEDA!";
        subColor = 'yellow';
        subFont = 'bold 36px "Verdana", Helvetica';
    }

    ctx.font = subFont;
    ctx.fillStyle = subColor;
    ctx.fillText(subText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    clearShadow();
}


//INICIJALIZACIJA I RESETIRANJE IGRE
//inicijalizacija 2d polja cigli
function initBricks() {
    bricks = [];    //reset
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        bricks[c] = [];
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            bricks[c][r] = { 
                x: brickX, 
                y: brickY, 
                status: 1   //1 = cigla aktivna
            };
        }
    }
}

//inicijalizacija igre
function initGame() {
    //palica na sredini
    paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    // loptica na sredini palice
    ballX = paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2;
    ballY = CANVAS_HEIGHT - PADDLE_HEIGHT - PADDLE_BOTTOM_OFFSET - BALL_SIZE;
    //slucajan pocetni smjer loptice - gore-lijevo ili gore-desno pod 45 stupnjeva 
    const initialDirectionX = (Math.random() < 0.5 ? -1 : 1);
    const speedComponent = INITIAL_BALL_SPEED * Math.cos(Math.PI / 4);
    dx = initialDirectionX * speedComponent;
    dy = -speedComponent;
    
    score = 0;  // reset bodova i cigli
    initBricks();

    gameStatus = 'PLAYING'; //status igre
}


//FUNKCIJE ZA SUDARE I KRETANJE LOPTICE
function wallAndPaddleCollision() {
    const currentBallX = ballX + dx;    //predvidenja x koordinata
    const currentBallY = ballY + dy;    //predvidena y koordinata
    const paddleY = CANVAS_HEIGHT - PADDLE_HEIGHT - PADDLE_BOTTOM_OFFSET;

    //sudar sa lijevim ili desnim zidom
    if (currentBallX + BALL_SIZE > CANVAS_WIDTH || currentBallX < 0) { 
        dx = -dx;   //obrni smjer x
    }

    //sudar sa gornjim zidom 
    if (currentBallY < 0) { 
        dy = -dy;  //obrni y smjer
    }

    //sudar s donjim rubom 
    if (currentBallY + BALL_SIZE > CANVAS_HEIGHT) { 
        gameStatus = 'GAME_OVER';   //gotova igra
    }

    //sudar s palicom
    if (
        //provjera jel stvarno doslo do sudara
        currentBallY + BALL_SIZE >= paddleY &&      
        currentBallY < paddleY + PADDLE_HEIGHT &&   
        currentBallX + BALL_SIZE > paddleX &&       
        currentBallX < paddleX + PADDLE_WIDTH &&     
        dy > 0
    ) {
        const relativeIntersectX = (currentBallX + BALL_SIZE / 2) - (paddleX + PADDLE_WIDTH / 2);   //udaljenost sredista loptice od stedista palice
        const normalizedIntersectX = relativeIntersectX / (PADDLE_WIDTH / 2);   //-1: loptica udarila lijevi kraj palice, 0: loptica udarila u sredinu, 1: loptica udarila desni kraj
        const MAX_ANGLE = Math.PI * 0.75;   //max kut odbijanja 135
        const bounceAngle = normalizedIntersectX * (MAX_ANGLE / 2);
        const speed = Math.sqrt(dx * dx + dy * dy);     //trenutna brzina
        dx = speed * Math.sin(bounceAngle);             //brzine nakon sudara
        dy = -speed * Math.cos(bounceAngle);
    }
}

//sudar loptice i cigli
function brickCollisionDetection() {
    let activeBricks = 0;   //brojac aktivnih cigli
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                activeBricks++;
                //provjera kolizije
                if (
                    ballX + dx < brick.x + BRICK_WIDTH &&
                    ballX + dx + BALL_SIZE > brick.x &&
                    ballY + dy < brick.y + BRICK_HEIGHT &&
                    ballY + dy + BALL_SIZE > brick.y
                ) {
                    //cigla pogodena - odbijanje
                    const prevBallX = ballX;
                    const prevBallY = ballY;
                    //provjera y kolizije
                    if (prevBallY + BALL_SIZE <= brick.y || prevBallY >= brick.y + BRICK_HEIGHT) { dy = -dy; }
                    //provjera x kolizije
                    else if (prevBallX + BALL_SIZE <= brick.x || prevBallX >= brick.x + BRICK_WIDTH) { dx = -dx; }
                    //ostatak
                    else { dy = -dy; }


                    brick.status = 0;  //azuriranje statusa, i bodova
                    score++;

                    if (score > highScore) { highScore = score; localStorage.setItem('breakoutHighScore', highScore); }
                   
                    return;
                }
            }
        }
    }
    //uvjet pobjede - sve cigle pogodene
    if (activeBricks === 0 && gameStatus === 'PLAYING') {
        gameStatus = 'WIN';
    }
}


//funkcija za pomicanje palice
function movePaddle() {
    //desno
    if (rightPressed && paddleX < CANVAS_WIDTH - PADDLE_WIDTH) { 
        paddleX += 7; 
    }//lijevo
    else if (leftPressed && paddleX > 0) { 
        paddleX -= 7; 
    }
}

//funkcija crtanja 
function draw() {
    //ciscenje canvasa svaki frame
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    //crtanje bodova, cigli, palice i loptice
    drawScore();
    drawBricks();
    drawPaddle();
    drawBall();

    //ako je igra u tijeku
    if (gameStatus === 'PLAYING') {
        //funkcije za igranje
        movePaddle();
        wallAndPaddleCollision();
        brickCollisionDetection();
        //azuriranje pozicija loptice
        ballX += dx;
        ballY += dy;
    } else {
        drawStatusText();       //START, OVER, WIN
    }
    requestAnimationFrame(draw);    
}

//listeneri za tipke
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

//kontrola palice
function keyDownHandler(e) {
    //desno - strelica desno ili slovo d
    if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") { rightPressed = true; }
    //lijevo - strelica lijevo ili tipka a
    else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { leftPressed = true; }
    //pokretanje na SPACE
    else if (e.key === " " && gameStatus !== 'PLAYING') {
        initGame();
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") { rightPressed = false; }
    else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { leftPressed = false; }
}

initBricks();
paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
ballX = paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2;
ballY = CANVAS_HEIGHT - PADDLE_HEIGHT - PADDLE_BOTTOM_OFFSET - BALL_SIZE;
requestAnimationFrame(draw);
