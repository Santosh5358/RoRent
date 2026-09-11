# 🚀 Room Rent App - Ready to Test!

Your app is now **live and ready to share** with friends!

## 📱 Installation & Access

### Option 1: **APK (Recommended for Mobile Testing)**

1. **Download APK:** `room-rent.apk` (3.1 MB)
2. **Transfer to Android phone** (USB cable or email)
3. **Install:** Open file → Install (may need to enable "Unknown Sources" in Settings)
4. **Open app** → Login screen shows "Server settings" toggle
5. **Optional:** If you want to test a different backend, tap Server settings, enter the URL, then login

**Default Server:** `https://rorent.onrender.com` (live backend)

**Demo Credentials:**
- **Username:** owner1
- **Password:** Welcome@123

---

### Option 2: **Web Browser (For Desktop/Laptop)**

**URL:** `https://rorent.onrender.com`

Open in any browser. Same login credentials as above.

---

## 🔑 Accounts to Test

| Role | Username | Password | What They Can Do |
|------|----------|----------|------------------|
| **Property Owner** | owner1 | Welcome@123 | Manage properties, rooms, tenants, view bills, payments |
| **Tenant** | tenant1 | Welcome@123 | View assigned room, electricity readings, pay bills, check balance |

**First Login:** Both accounts require password change (security feature)
- New password must be different from `Welcome@123`
- After change, use your new password for future logins

---

## 🌐 Backend Information

- **Live Server:** `https://rorent.onrender.com`
- **Database:** MongoDB Atlas (Cloud)
- **Status:** Always running (free Render tier)

**Note:** First request may take 5-10 seconds to wake up (Render free tier spins down inactive apps)

---

## 📋 Features to Test

✅ **Owner Dashboard:**
- View properties and rooms
- Manage tenants (create, update, deactivate)
- Track electricity readings
- Generate bills
- Monitor payments

✅ **Tenant Portal:**
- View assigned room details
- Check electricity consumption
- View billing history
- Make payments

✅ **Payment Tracking:**
- Submit payments (rent, electricity)
- View payment history
- Track outstanding balances

---

## ⚙️ Advanced: Custom Backend URL

If you want to test against a different backend server:

1. Open the app → **Server settings** (login screen)
2. Enter backend URL: `https://your-custom-backend.com`
3. Tap **Save**
4. Login as usual

The app remembers this setting on your device.

---

## 🐛 Feedback & Issues

Please report any issues:
- Bugs, crashes, UI issues
- Login/authentication problems
- Payment or billing errors
- Performance issues

Share:
- Screenshots of errors
- Steps to reproduce
- Device info (phone model, Android version)

---

## 📞 Support

Backend status & deployment info:
- GitHub: [RoRent Repository](https://github.com/Santosh5358/RoRent)
- Backend Logs: Render Dashboard → room-rent-backend → Logs
- Questions: Contact project owner

---

**Enjoy testing! 🎉**
