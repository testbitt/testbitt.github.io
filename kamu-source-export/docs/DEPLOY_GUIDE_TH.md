# คู่มือย้าย KAMU Inventory Stock Checker v3.38

1. สร้าง PostgreSQL/Supabase ใหม่ แล้วนำ database/schema.sql ไปสร้างตารางและ index
2. Deploy Edge Functions ทั้ง 3 ตัวใน backend/edge-functions
3. ตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY เฉพาะฝั่ง Server
4. เปลี่ยน URL Backend เดิมใน frontend ให้เป็น URL ของ Backend ใหม่
5. เปลี่ยน Admin Password/Hash ก่อนเปิดใช้งานจริง
6. นำโฟลเดอร์ frontend ไปวางบน Static Web Server เช่น Nginx, Apache หรือ Static Hosting
7. หากต้องการข้อมูลเดิม ให้ Backup/Restore เฉพาะตาราง kamu_inventory_* จากฐานเดิม
8. แนะนำไม่ย้าย Session เดิม เพื่อให้ User Login ใหม่หลังย้าย Host
9. ทดสอบ User Login, Admin, Upload, Inventory Audit, Usage Source, Manual Cal, Custom Check, Shared Group, History, Planning และ Export ก่อนสลับ Domain
10. เก็บ Production เดิมไว้จน Server ใหม่ผ่านการทดสอบจริง

ระบบปัจจุบันใช้ Custom Session Token จึงตั้ง Edge Functions แบบไม่ตรวจ Supabase Auth JWT.
ห้ามนำ Service Role Key ไปใส่ใน Frontend.
