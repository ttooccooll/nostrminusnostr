import QRCode from 'qrcode-generator';

export function convertTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

export function copyTextToClipboard(text) {
    var tempInput = document.createElement("input");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
}

export function generateQRCode(paymentRequest) {
    const typeNumber = 0;
    const errorCorrectionLevel = 'L';
    const qr = QRCode(typeNumber, errorCorrectionLevel);
    qr.addData(paymentRequest);
    qr.make();
    return qr;
}

export function parseContent(content) {
    if (content) {
        const urlRegex = /(https?:\/\/[^\s'"<>()?]+)/g;
        content = content.replace(urlRegex, url => {
            if (/\.(png|jpg|jpeg|gif|bmp)$/i.test(url)) {
                return `<img src="${url}" class="notez" />`;
            } else if (/\.(mp4|webm)$/i.test(url)) {
                return `<video controls class="notez"><source src="${url}" type="video/mp4"></video>`;
            } else if (/\.(mp3|wav)$/i.test(url)) {
                return `<audio controls class="notez"><source src="${url}" type="audio/mpeg"></audio>`;
            } else {
                return `<a href="${url}" target="_blank">${url}</a>`;
            }
        });
        return content;
    } else {
        return 'I have not written a profile. Ergo, the more time you spend reading right here, the less time you are doing something productive. Go get a hobby and stop reading filler info on a random nostr client. The person who is associated with this npub did not write this. Do you understand what I am saying? You are truly wasting your time.';
    }
}

export async function zapAction(user, kind1Event) {
    const audio = new Audio('/ding.mp3');
    audio.volume = 0.03;
    audio.play();
    if (!user || !kind1Event) return;
    const event = kind1Event;
    const amount = 2000000;
    const comment = prompt("You are about to cast a 2000 sat thunderbolt on this note. Speak your mind if you like!") || "";

    try {
        console.log(kind1Event);
        const paymentRequest = await event.zap(amount, comment);
        const modal = document.createElement('div');
        const qrCodeData = generateQRCode(paymentRequest);
        const qrCodeImgTag = qrCodeData.createImgTag(4);
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.padding = '20px';
        modal.style.background = 'black';
        modal.style.color = 'white';
        modal.style.border = '1px solid #ccc';
        modal.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <p>Call down the thunder!</p>
            <div class="qr-code">${qrCodeImgTag}</div>
            </br>
            <textarea class="paymentRequest" rows="5" cols="50">${paymentRequest}</textarea>
            </br>
            <button class="zap" onclick="copyPaymentRequest()">Copy</button>
            </br>
            <span class="close" onclick="closeModal()">&times;</span>
        `;
        document.body.appendChild(modal);
        const closeButton = modal.querySelector('.close');
        closeButton.onclick = function() {
            modal.style.display = "none";
        };
        window.copyPaymentRequest = function() {
            const paymentRequestTextarea = document.querySelector('.paymentRequest');
            paymentRequestTextarea.select();
            document.execCommand('copy');
        };
    } catch (error) {
        console.error("Error zapping funds:", error);
        alert("You can't zap this note. The author hasn't provided a payout address.");
    }
}
