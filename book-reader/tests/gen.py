import zipfile, os, random
W='abcdefghij'
def z(name, files, stored_first=None):
    with zipfile.ZipFile(name,'w') as f:
        if stored_first: f.writestr(stored_first[0], stored_first[1], compress_type=zipfile.ZIP_STORED)
        for k,v in files.items(): f.writestr(k,v,compress_type=zipfile.ZIP_DEFLATED)
z('book.epub', {
 'META-INF/container.xml':'<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
 'OEBPS/content.opf':'<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Test Epub Book</dc:title></metadata><manifest><item id="c1" href="ch%201.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="text/c2.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>',
 'OEBPS/ch 1.xhtml':'<html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title></head><body><h1>The Beginning</h1><p>It was a dark night. The wind howled.</p></body></html>',
 'OEBPS/text/c2.xhtml':'<html xmlns="http://www.w3.org/1999/xhtml"><body><h2>The End</h2><p>Everyone went home.</p></body></html>'},
 stored_first=('mimetype','application/epub+zip'))
z('doc.docx', {
 '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'word/styles.xml':'<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>',
 'word/document.xml':'<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+''.join(f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Part {i}</w:t></w:r></w:p><w:p><w:r><w:t>Word paragraph {i}. Another sentence here.</w:t></w:r></w:p>' for i in (1,2))+'</w:body></w:document>'})
z('doc.odt', {'content.xml':'<?xml version="1.0"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text><text:h>Alpha</text:h><text:p>Odt first. Odt second.</text:p><text:h>Beta</text:h><text:p>Odt third.</text:p></office:text></office:body></office:document-content>'}, stored_first=('mimetype','application/vnd.oasis.opendocument.text'))
open('doc.rtf','w').write(r'{\rtf1\ansi{\fonttbl{\f0 Arial;}}\f0 Hello from RTF.\par Caf\'e9 is nice.\par}')
open('doc.md','w').write('# Intro\n\nSome **bold** text with a [link](http://x.y).\n\n# Next\n\nMore text.\n')
open('doc.html','w').write('<!doctype html><html><head><style>p{}</style><script>window.__bad=1</script></head><body><h1>H One</h1><p>Para one.</p><h2>H Two</h2><ul><li>Item a.</li></ul></body></html>')
open('doc.csv','w').write('name,age\nBob,30\n')
open('doc.json','w').write('{"title":"Json book","items":["one","two"]}')
open('doc.srt','w').write('1\n00:00:01,000 --> 00:00:02,000\nHello subtitle.\n\n2\n00:00:03,000 --> 00:00:04,000\nSecond line.\n')
open('cjk.txt','w').write('这是第一句。这是第二句！\n\nمرحبا بالعالم. هذه جملة ثانية.\n')
open('xss <img src=x onerror=alert(1)>.txt','w').write('<script>alert(2)</script> Hello <b>world</b>. <img src=x onerror="alert(3)">\n')
open('empty.txt','w').write('')
open('bin.dat','wb').write(bytes(random.Random(1).randrange(256) for _ in range(5000)))
open('bad.epub','wb').write(b'PK\x03\x04garbage'*50)
open('bad.pdf','wb').write(b'%PDF-1.4 garbage garbage')
open('bad.docx','wb').write(b'not a zip at all')
r=random.Random(2)
def sent(): return ' '.join(''.join(r.choice(W) for _ in range(r.randint(2,9))) for _ in range(r.randint(4,18))).capitalize()+'.'
with open('big.txt','w') as f:
    for c in range(60):
        f.write(f'Chapter {c+1}\n\n')
        for p in range(120): f.write(' '.join(sent() for _ in range(5))+'\n\n')
with open('bightml.html','w') as f:
    f.write('<html><body><h1>Huge</h1>'+''.join(f'<div><p>{sent()} {sent()}</p></div>' for _ in range(15000))+'</body></html>')
open('book.txt','w').write('Chapter 1\n\nAlpha one. Alpha two.\n\nAlpha three.\n\nChapter 2\n\nBeta one. Beta two.\n\nChapter 3\n\nGamma one.\n')
print({f: os.path.getsize(f) for f in os.listdir('.') if not f.endswith('.py')})
