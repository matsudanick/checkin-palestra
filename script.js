const SB_URL = 'https://fngzmhosxjwniapefedm.supabase.co';
const SB_KEY = 'sb_publishable_iTOYltH5KRMurCbjwIAuQA__lnQlwiM';
const _supabase = supabase.createClient(SB_URL, SB_KEY);
const ID_PALESTRA = "PALESTRA_UMC_ABRIL_2026";

const overlay = document.getElementById('signature-overlay');
const canvas = document.getElementById('signature-pad');
const signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });

function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = window.innerWidth * ratio;
    canvas.height = (window.innerHeight - 80) * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear();
}

document.getElementById('openSignature').addEventListener('click', () => {
    overlay.style.display = 'flex';
    resizeCanvas();
});

document.getElementById('saveSignature').addEventListener('click', () => {
    if (!signaturePad.isEmpty()) {
        overlay.style.display = 'none';
        document.getElementById('openSignature').style.display = 'none';
        document.getElementById('msgAssinado').style.display = 'block';
    } else { alert("Assine antes de fechar!"); }
});

document.getElementById('clear').addEventListener('click', () => signaturePad.clear());

let userLoc = { lat: null, lon: null };
navigator.geolocation.getCurrentPosition((pos) => {
    userLoc.lat = pos.coords.latitude; userLoc.lon = pos.coords.longitude;
    document.getElementById('gpsMsg').innerText = "📍 Localização OK";
    document.getElementById('gpsMsg').style.color = "#00ff88";
    document.getElementById('btnEnviar').disabled = false;
    document.getElementById('btnEnviar').innerText = "CONFIRMAR PRESENÇA";
}, (err) => {
    document.getElementById('gpsMsg').innerText = "⚠️ Ative o GPS para prosseguir.";
    document.getElementById('gpsMsg').style.color = "#ff4444";
});

document.getElementById('checkinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    btn.disabled = true; btn.innerText = "REGISTRANDO...";

    try {
        // Bloqueio de duplicidade no mesmo navegador
        if (localStorage.getItem('checkin_' + ID_PALESTRA)) {
            throw new Error("Você já registrou presença neste navegador.");
        }

        const ipData = await fetch('https://api.ipify.org?format=json').then(r => r.json());
        const d = [navigator.userAgent, screen.width].join('|');
        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(d));
        const fPrint = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

        const { error } = await _supabase.from('presencas_palestra').insert([{
            nome_aluno: document.getElementById('nome').value,
            rgm_aluno: document.getElementById('rgm').value,
            curso: document.getElementById('curso').value,
            semestre: parseInt(document.getElementById('semestre').value),
            id_palestra: ID_PALESTRA,
            latitude: userLoc.lat.toString(),
            longitude: userLoc.lon.toString(),
            ip_origem: ipData.ip,
            device_fingerprint: fPrint,
            assinatura: signaturePad.toDataURL()
        }]);

        if (error) throw error;

        localStorage.setItem('checkin_' + ID_PALESTRA, 'true');
        alert("✅ Presença registrada!");
        location.reload();
        
    } catch (err) {
        alert("Erro: " + (err.code === '23505' ? "Este RGM já foi cadastrado!" : err.message));
        btn.disabled = false; btn.innerText = "TENTAR NOVAMENTE";
    }
});