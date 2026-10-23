import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { MesFinanciero, UserProfile } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyAQFoBTeMUxW6MV4-JILADNaRuSBvGktqM",
  authDomain: "app-finanzas-faciles.firebaseapp.com",
  projectId: "app-finanzas-faciles",
  storageBucket: "app-finanzas-faciles.firebasestorage.app",
  messagingSenderId: "1032027994633",
  appId: "1:1032027994633:web:550e47ba205ab6f4db16d8",
  measurementId: "G-YVFCB9BHKZ"
};

// Inicialización de Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export function getCurrentFirebaseUser(): User | null {
  return auth.currentUser;
}

// 1. Registro con Correo en Firebase Authentication y creación en Firestore
export async function registerWithFirebase(
  nombre: string,
  email: string,
  password: string,
  avatarEmoji?: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre.trim();

    if (!cleanNombre) {
      return { success: false, message: 'Por favor ingresa tu nombre completo.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'La contraseña debe tener mínimo 6 caracteres.' };
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = cred.user;

    // Asignar el nombre en el perfil de Firebase
    await updateProfile(fbUser, { displayName: cleanNombre });

    const userProfile: UserProfile = {
      id: fbUser.uid,
      nombre: cleanNombre,
      email: cleanEmail,
      creadoEn: new Date().toISOString(),
      ultimaSincronizacion: new Date().toISOString(),
      ...(avatarEmoji ? { avatarEmoji } : {})
    };

    // Guardar metadata en Firestore: colección "users"
    try {
      const userDocRef = doc(db, 'contamepues_users', fbUser.uid);
      await setDoc(userDocRef, {
        nombre: cleanNombre,
        email: cleanEmail,
        avatarEmoji: avatarEmoji || null,
        creadoEn: new Date().toISOString(),
        ultimaSincronizacion: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Advertencia al guardar perfil en Firestore:', fsErr);
    }

    return { success: true, user: userProfile };
  } catch (error: any) {
    let msg = 'No se pudo crear la cuenta en la nube.';
    if (error.code === 'auth/email-already-in-use') {
      msg = 'Ya existe una cuenta registrada con este correo. Puedes iniciar sesión.';
    } else if (error.code === 'auth/invalid-email') {
      msg = 'El formato del correo electrónico no es válido.';
    } else if (error.code === 'auth/weak-password') {
      msg = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
    } else if (error.code === 'auth/network-request-failed') {
      msg = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
}

// 2. Inicio de Sesión con Autenticación en la Nube
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: UserProfile;
  cloudMonths?: MesFinanciero[];
  cloudExtra?: {
    suscripciones?: any[];
    presupuestos?: any[];
    deudas?: any[];
    avatarEmoji?: string;
  };
  message?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!password) {
      return { success: false, message: 'Por favor ingresa tu contraseña.' };
    }

    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = cred.user;

    let userDisplayName = fbUser.displayName || cleanEmail.split('@')[0];
    let userAvatarEmoji: string | undefined = undefined;

    // Leer datos del perfil de usuario en Firestore: colección "users"
    try {
      const userDocRef = doc(db, 'contamepues_users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const uData = userDocSnap.data();
        if (uData?.nombre) userDisplayName = uData.nombre;
        if (uData?.avatarEmoji) userAvatarEmoji = uData.avatarEmoji;
      }
    } catch (uErr) {
      console.warn('Advertencia al leer perfil de Firestore:', uErr);
    }

    // Descargar datos financieros respaldados en la nube si existen
    let cloudMonths: MesFinanciero[] | undefined = undefined;
    let cloudExtra: {
      suscripciones?: any[];
      presupuestos?: any[];
      deudas?: any[];
      avatarEmoji?: string;
    } | undefined = undefined;

    try {
      const financesDocRef = doc(db, 'contamepues_users', fbUser.uid, 'data', 'finances');
      const snap = await getDoc(financesDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.months) && data.months.length > 0) {
          cloudMonths = data.months;
        }
        if (!userAvatarEmoji && data?.avatarEmoji) {
          userAvatarEmoji = data.avatarEmoji;
        }
        if (data && (data.suscripciones || data.presupuestos || data.deudas || data.avatarEmoji)) {
          cloudExtra = {
            suscripciones: Array.isArray(data.suscripciones) ? data.suscripciones : undefined,
            presupuestos: Array.isArray(data.presupuestos) ? data.presupuestos : undefined,
            deudas: Array.isArray(data.deudas) ? data.deudas : undefined,
            avatarEmoji: data.avatarEmoji || undefined
          };
        }
      }
    } catch (fsErr) {
      console.warn('Advertencia al leer datos de la nube:', fsErr);
    }

    const userProfile: UserProfile = {
      id: fbUser.uid,
      nombre: userDisplayName,
      email: cleanEmail,
      creadoEn: new Date().toISOString(),
      ultimaSincronizacion: new Date().toISOString(),
      ...(userAvatarEmoji ? { avatarEmoji: userAvatarEmoji } : {})
    };

    return { success: true, user: userProfile, cloudMonths, cloudExtra };
  } catch (error: any) {
    let msg = 'No se pudo iniciar sesión en la nube.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      msg = 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.';
    } else if (error.code === 'auth/wrong-password') {
      msg = 'Contraseña incorrecta.';
    } else if (error.code === 'auth/invalid-email') {
      msg = 'El formato del correo es inválido.';
    } else if (error.code === 'auth/too-many-requests') {
      msg = 'Demasiados intentos fallidos. Intenta nuevamente más tarde.';
    } else if (error.code === 'auth/network-request-failed') {
      msg = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
}

// 3. Cerrar Sesión
export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {}
}

// 4. Sincronizar Meses, Presupuestos, Módulos y Avatar en la Nube
export async function syncMonthsToFirestore(
  userId: string,
  months: MesFinanciero[],
  extraData?: {
    suscripciones?: any[];
    presupuestos?: any[];
    deudas?: any[];
    avatarEmoji?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentFbUser = auth.currentUser;
    const targetUid = currentFbUser ? currentFbUser.uid : userId;

    if (!targetUid || (!currentFbUser && (targetUid.startsWith('user_local_') || targetUid.startsWith('user_')))) {
      return { success: false, message: 'Usuario en modo local. Por favor vincula tu cuenta con una contraseña para sincronizar en la nube.' };
    }

    const financesDocRef = doc(db, 'contamepues_users', targetUid, 'data', 'finances');
    const payload: any = {
      months: months,
      ultimaActualizacion: new Date().toISOString()
    };
    if (extraData?.suscripciones) payload.suscripciones = extraData.suscripciones;
    if (extraData?.presupuestos) payload.presupuestos = extraData.presupuestos;
    if (extraData?.deudas) payload.deudas = extraData.deudas;
    if (extraData?.avatarEmoji) payload.avatarEmoji = extraData.avatarEmoji;

    await setDoc(financesDocRef, payload, { merge: true });

    if (extraData?.avatarEmoji) {
      try {
        const userDocRef = doc(db, 'contamepues_users', targetUid);
        await setDoc(userDocRef, { avatarEmoji: extraData.avatarEmoji, ultimaActualizacion: new Date().toISOString() }, { merge: true });
      } catch (e) {}
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error al sincronizar en Firestore:', error);
    return { success: false, message: error?.message || 'Error de sincronización en la nube.' };
  }
}

// 5. Guardar / Actualizar Avatar de Usuario en Cloud Firestore
export async function updateUserAvatarInFirestore(userId: string, avatarEmoji: string): Promise<void> {
  try {
    const currentFbUser = auth.currentUser;
    const targetUid = currentFbUser ? currentFbUser.uid : userId;
    if (!targetUid || targetUid.startsWith('user_local_') || targetUid.startsWith('user_')) {
      return;
    }
    const userDocRef = doc(db, 'contamepues_users', targetUid);
    await setDoc(userDocRef, {
      avatarEmoji: avatarEmoji,
      ultimaActualizacion: new Date().toISOString()
    }, { merge: true });

    const financesDocRef = doc(db, 'contamepues_users', targetUid, 'data', 'finances');
    await setDoc(financesDocRef, {
      avatarEmoji: avatarEmoji,
      ultimaActualizacion: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Error al guardar avatar en Firestore:', e);
  }
}

// 6. Descargar Todos los Datos del Usuario desde Cloud Firestore
export async function fetchFullUserDataFromFirestore(userId: string): Promise<{
  months?: MesFinanciero[];
  suscripciones?: any[];
  presupuestos?: any[];
  deudas?: any[];
  avatarEmoji?: string;
  nombre?: string;
} | null> {
  try {
    if (!userId || userId.startsWith('user_local_') || userId.startsWith('user_')) return null;
    let avatarEmoji: string | undefined = undefined;
    let nombre: string | undefined = undefined;

    try {
      const userDocRef = doc(db, 'contamepues_users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData?.avatarEmoji) avatarEmoji = uData.avatarEmoji;
        if (uData?.nombre) nombre = uData.nombre;
      }
    } catch (e) {}

    const financesDocRef = doc(db, 'contamepues_users', userId, 'data', 'finances');
    const snap = await getDoc(financesDocRef);
    let months: MesFinanciero[] | undefined = undefined;
    let suscripciones: any[] | undefined = undefined;
    let presupuestos: any[] | undefined = undefined;
    let deudas: any[] | undefined = undefined;

    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.months) && data.months.length > 0) {
        months = data.months as MesFinanciero[];
      }
      if (data?.suscripciones && Array.isArray(data.suscripciones)) {
        suscripciones = data.suscripciones;
      }
      if (data?.presupuestos && Array.isArray(data.presupuestos)) {
        presupuestos = data.presupuestos;
      }
      if (data?.deudas && Array.isArray(data.deudas)) {
        deudas = data.deudas;
      }
      if (!avatarEmoji && data?.avatarEmoji) {
        avatarEmoji = data.avatarEmoji;
      }
    }

    return { months, suscripciones, presupuestos, deudas, avatarEmoji, nombre };
  } catch (e) {
    console.error('Error al descargar datos completos de Firestore:', e);
    return null;
  }
}

// 7. Descargar Meses y Presupuestos desde Cloud Firestore (Compatibilidad)
export async function fetchMonthsFromFirestore(
  userId: string
): Promise<MesFinanciero[] | null> {
  try {
    if (!userId) return null;
    const financesDocRef = doc(db, 'contamepues_users', userId, 'data', 'finances');
    const snap = await getDoc(financesDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.months)) {
        return data.months as MesFinanciero[];
      }
    }
    return null;
  } catch (e) {
    console.error('Error al descargar de Firestore:', e);
    return null;
  }
}

// 6. Restablecer Contraseña (Olvidó su contraseña)
export async function resetPasswordWithFirebase(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      message: `Enlace de recuperación enviado a ${cleanEmail}. Revisa tu bandeja de entrada o spam para restablecer tu contraseña.`
    };
  } catch (error: any) {
    let msg = 'No se pudo enviar el correo de recuperación.';
    if (error.code === 'auth/user-not-found') {
      msg = 'No existe ninguna cuenta registrada con este correo.';
    } else if (error.code === 'auth/invalid-email') {
      msg = 'El formato del correo es inválido.';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
}

// 7. Actualizar Nombre de Usuario (sin cambiar correo)
export async function updateUserProfileName(newName: string): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanName = newName.trim();
    if (!cleanName) {
      return { success: false, message: 'El nombre no puede estar vacío.' };
    }
    const currentFbUser = auth.currentUser;
    if (currentFbUser) {
      await updateProfile(currentFbUser, { displayName: cleanName });
      try {
        const userDocRef = doc(db, 'contamepues_users', currentFbUser.uid);
        await setDoc(userDocRef, { nombre: cleanName, ultimaActualizacion: new Date().toISOString() }, { merge: true });
      } catch (e) {}
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Error al actualizar el nombre de usuario.' };
  }
}
