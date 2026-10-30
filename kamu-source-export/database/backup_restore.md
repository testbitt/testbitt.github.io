# Backup / Restore

Source package ไม่ฝังข้อมูล Production หรือ Secret.

ให้ Backup เฉพาะตารางที่ขึ้นต้นด้วย kamu_inventory_ จาก PostgreSQL/Supabase เดิม และ Restore หลังจากสร้าง schema.sql ในฐานใหม่แล้ว

ตารางหลักที่ต้องย้าย:
- kamu_inventory_users
- kamu_inventory_datasets
- kamu_inventory_dataset_chunks
- kamu_inventory_uploads
- kamu_inventory_counts
- kamu_inventory_custom_checks
- kamu_inventory_shared_custom_checks
- kamu_inventory_reorder_settings
- kamu_inventory_audit_history

Activity Log ย้ายได้ตามต้องการ
Session แนะนำไม่ย้าย เพื่อบังคับ Login ใหม่หลัง Cutover

ข้อสำคัญ: Supabase Project ปัจจุบันมีข้อมูลระบบ KSP อื่นร่วมอยู่ด้วย ห้าม Backup/Restore ตารางที่ไม่ใช่ kamu_inventory_* เป็นส่วนหนึ่งของการย้าย Web App นี้.
