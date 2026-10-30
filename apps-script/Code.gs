/**
 * Web App que recebe o PDF gerado pelo clique no brasão da escala e o grava
 * na pasta do Drive abaixo. Se já houver PDF do mesmo mês na pasta, ele é
 * movido para a lixeira e substituído pelo novo.
 *
 * Implantação: Implantar → Nova implantação → Tipo "App da Web"
 *   Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * Copie a URL /exec para DRIVE_ENDPOINT em js/escala.js.
 */
var FOLDER_ID = '1ShxeuvTNRakC4KoKe95hXUL1-ZVKZ3k3';
var NOME_VALIDO = /^Escala_Supervisao_SPA_(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)(\d{4})\.pdf$/;
var TAMANHO_MAX = 30 * 1024 * 1024;

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse(e.postData.contents);
    var nome = String(body.name || '');
    var m = NOME_VALIDO.exec(nome);
    if (!m) throw new Error('Nome de arquivo inválido: ' + nome);

    var bytes = Utilities.base64Decode(String(body.data || ''));
    if (bytes.length > TAMANHO_MAX) throw new Error('PDF maior que o permitido.');
    // Confere a assinatura "%PDF".
    if (bytes.length < 4 || bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70) {
      throw new Error('Conteúdo não é um PDF.');
    }

    lock.waitLock(30000);
    var pasta = DriveApp.getFolderById(FOLDER_ID);
    var mes = m[1] + m[2]; // ex.: OUT2026
    var antigos = pasta.getFilesByType(MimeType.PDF), substituidos = 0;
    while (antigos.hasNext()) {
      var f = antigos.next();
      if (f.getName().toUpperCase().indexOf(mes) !== -1) { f.setTrashed(true); substituidos++; }
    }
    var arquivo = pasta.createFile(Utilities.newBlob(bytes, MimeType.PDF, nome));
    return json_({ ok: true, id: arquivo.getId(), url: arquivo.getUrl(), substituidos: substituidos });
  } catch (err) {
    return json_({ ok: false, erro: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
