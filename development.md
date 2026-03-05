# Development Log

Bu dosya, geliştirme sürecini bir hikaye gibi takip etmek için tutulur.  
Teknik olmayan birinin bile anlayabileceği dilde yazılır.

## Kural
- Ben her kod değişikliğinden sonra bu dosyaya yeni bir kayıt ekleyeceğim.
- Her kayıtta şu 3 soru cevaplanacak:
  - Neyi değiştirdik?
  - Neden değiştirdik?
  - Bu değişiklik nasıl çalışıyor?
- Sen "artık yapma" diyene kadar bu kayıt süreci devam edecek.

---

## 2026-03-05 - Grouped Explainability (Phase 1 / Workstream 1)

### Neyi değiştirdik?
- Lead detayındaki "Why this score" bölümünü tek uzun listeden çıkarıp 4 gruba böldük:
  - Engagement
  - Fit
  - Recency
  - Source

### Neden değiştirdik?
- Kullanıcı skorun neden böyle çıktığını daha hızlı anlasın diye.
- Dağınık satırlar yerine mantıksal gruplar, güveni ve okunabilirliği artırır.

### Bu değişiklik nasıl çalışıyor?
- Skor motoru artık her katkıya bir grup etiketi veriyor.
- Dashboard bu etiketlere göre katkıları kutular halinde gösteriyor.
- Eski (legacy) verilerde grup etiketi olmasa bile sistem anahtar adına bakıp doğru gruba yerleştiriyor.

### Vizyon etkisi
- "Bugün önce kimi aramalıyım?" sorusuna sadece skorla değil, skorun açıklamasıyla da net cevap verme hedefini güçlendirir.
