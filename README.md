1-Node.js ve npm yüklü olmalıdır.
Angular CLI yüklü olmalıdır. Yüklemek için aşağıdaki komutu kullanabilirsiniz:
npm install -g @angular/cli

---

2-Proje dizinine gidin:
cd baski_editoru_app

---

3-Projeyi geliştirme sunucusunda çalıştırın:
ng serve -o

---

4-Proje dosya yapısı aşağıdaki gibidir:
baski_editoru_app/
│
├── src/
│ ├── app/
│ │ ├── app.component.ts
│ │ ├── app.component.html
│ │ ├── app.component.css
│ │ └── app.module.ts
│ │
│ ├── assets/
│ ├── environments/
│ ├── index.html
│ ├── main.ts
│ ├── polyfills.ts
│ └── styles.css
│
├── angular.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json

---

5-Proje Özellikleri:
Kullanıcılar, metin veya görsel ekleyebilir ve bunları sürükleyerek veya yeniden boyutlandırarak düzenleyebilir.
CKEditor entegrasyonu ile zengin metin düzenleme imkanı sağlar.
Proje API ile iletişim kurarak verileri kaydedebilir ve güncelleyebilir.

---

6-Kullanım Talimatları
Bir öğe eklemek için, formu doldurun ve "Ekle" butonuna tıklayın.
Bir öğeyi sürüklemek için, öğeye tıklayın ve istediğiniz konuma taşıyın.
Bir öğeyi yeniden boyutlandırmak için, öğeye shift tuşuna basılı tutarak tıklayın ve köşelerden çekin.
Bir öğeyi silmek için, öğeye tıklayın ve delete tuşuna basın.
