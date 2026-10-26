import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

export const CATEGORIES = [
  { id: 'oleo', nome: 'Óleo de Cozinha', cor: '#f59e0b', icone: 'droplets' },
  { id: 'reversa', nome: 'Logística Reversa', cor: '#3b82f6', icone: 'refresh-cw' },
  { id: 'ecoponto', nome: 'Ecopontos Municipais', cor: '#22c55e', icone: 'map-pin' }
];

export const POINT_STATUSES = {
  ABERTO: { id: 'ABERTO', label: 'Aberto agora', cor: '#16a34a', bg: '#dcfce7', dot: '#22c55e' },
  LOTADO: { id: 'LOTADO', label: 'Capacidade Máxima', cor: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  FECHADO: { id: 'FECHADO', label: 'Fechado', cor: '#dc2626', bg: '#fee2e2', dot: '#ef4444' }
};

export const CATA_TRECO_TYPES = [
  { id: 'moveis', nome: 'Móveis (Sofá, Armário, Mesa)' },
  { id: 'eletrodomesticos', nome: 'Eletrodomésticos Grandes (Geladeira, Fogão, Máquina)' },
  { id: 'colchoes', nome: 'Colchões e Estofados' },
  { id: 'madeira', nome: 'Restos de Madeira / Poda' },
  { id: 'outros', nome: 'Outros Volumosos' }
];

export const CATA_TRECO_STATUSES = {
  PENDENTE: { id: 'PENDENTE', label: 'Aguardando Análise', cor: '#d97706', bg: '#fef3c7' },
  AGENDADO: { id: 'AGENDADO', label: 'Agendado', cor: '#2563eb', bg: '#dbeafe' },
  EM_ROTA: { id: 'EM_ROTA', label: 'Caminhão em Rota', cor: '#7c3aed', bg: '#ede9fe' },
  CONCLUIDO: { id: 'CONCLUIDO', label: 'Coleta Concluída', cor: '#16a34a', bg: '#dcfce7' },
  CANCELADO: { id: 'CANCELADO', label: 'Cancelado', cor: '#dc2626', bg: '#fee2e2' }
};

export function getPointLiveStatus(ponto) {
  if (!ponto) return POINT_STATUSES.ABERTO;
  if (ponto.statusOperacional === 'LOTADO') return POINT_STATUSES.LOTADO;
  if (ponto.statusOperacional === 'FECHADO') return POINT_STATUSES.FECHADO;
  if (ponto.statusOperacional === 'ABERTO') return POINT_STATUSES.ABERTO;

  // Cálculo automático opcional caso tenha horário de abertura e fechamento (formato HH:MM)
  if (ponto.horarioAbertura && ponto.horarioFechamento) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = ponto.horarioAbertura.split(':').map(Number);
    const [closeH, closeM] = ponto.horarioFechamento.split(':').map(Number);
    if (!isNaN(openH) && !isNaN(closeH)) {
      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);
      if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
        return POINT_STATUSES.FECHADO;
      }
    }
  }

  return POINT_STATUSES.ABERTO;
}

export async function getPoints(approvedOnly = true) {
  try {
    const q = approvedOnly
      ? query(collection(db, 'collectionPoints'), where('approved', '==', true))
      : collection(db, 'collectionPoints');

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erro ao buscar pontos', error);
    return [];
  }
}

export async function addPoint(data) {
  try {
    const docRef = await addDoc(collection(db, 'collectionPoints'), {
      statusOperacional: 'ABERTO',
      ...data,
      approved: false,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Erro ao adicionar ponto', error);
    return { success: false, error };
  }
}

export async function updatePointStatus(id, approved, auditedBy = null) {
  try {
    const pointRef = doc(db, 'collectionPoints', id);
    await updateDoc(pointRef, {
      approved,
      ...(auditedBy ? { auditedBy, auditedAt: serverTimestamp() } : {})
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar ponto', error);
    return { success: false, error };
  }
}

export async function updatePointOperationalStatus(id, statusOperacional) {
  try {
    const pointRef = doc(db, 'collectionPoints', id);
    await updateDoc(pointRef, {
      statusOperacional,
      statusUpdatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status operacional do ponto', error);
    return { success: false, error };
  }
}

export async function getPoint(id) {
  try {
    const docRef = doc(db, 'collectionPoints', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar ponto', error);
    return null;
  }
}

export async function updatePoint(id, data) {
  try {
    const pointRef = doc(db, 'collectionPoints', id);
    await updateDoc(pointRef, data);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar dados do ponto', error);
    return { success: false, error };
  }
}

export async function deletePoint(id) {
  try {
    const pointRef = doc(db, 'collectionPoints', id);
    await deleteDoc(pointRef);
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir ponto', error);
    return { success: false, error };
  }
}

// ==========================================
// CATA-TRECO (AGENDAMENTO E OTIMIZAÇÃO DE ROTAS)
// ==========================================

export async function createCataTrecoRequest(data) {
  try {
    const docRef = await addDoc(collection(db, 'cataTrecoRequests'), {
      ...data,
      status: 'PENDENTE',
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Erro ao criar agendamento do Cata-Treco', error);
    return { success: false, error };
  }
}

export async function getCataTrecoRequests(userId = null) {
  try {
    const q = userId
      ? query(collection(db, 'cataTrecoRequests'), where('userId', '==', userId))
      : collection(db, 'cataTrecoRequests');

    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do Cata-Treco', error);
    return [];
  }
}

export async function updateCataTrecoStatus(id, status, extraData = {}) {
  try {
    const ref = doc(db, 'cataTrecoRequests', id);
    await updateDoc(ref, {
      status,
      ...extraData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status do Cata-Treco', error);
    return { success: false, error };
  }
}

export async function deleteCataTrecoRequest(id) {
  try {
    const ref = doc(db, 'cataTrecoRequests', id);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir agendamento do Cata-Treco', error);
    return { success: false, error };
  }
}

// ==========================================
// DASHBOARD DE IMPACTO AMBIENTAL
// ==========================================

export async function addImpactLog(data) {
  try {
    const docRef = await addDoc(collection(db, 'impactLogs'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Erro ao registrar impacto ambiental', error);
    return { success: false, error };
  }
}

export async function getImpactLogs() {
  try {
    const snapshot = await getDocs(collection(db, 'impactLogs'));
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
  } catch (error) {
    console.error('Erro ao buscar registros de impacto', error);
    return [];
  }
}
