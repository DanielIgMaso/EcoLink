import { db } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';

export const CATEGORIES = [
  { id: 'oleo', nome: 'Óleo de Cozinha', cor: '#f59e0b', icone: 'droplets' },
  { id: 'reversa', nome: 'Logística Reversa', cor: '#3b82f6', icone: 'refresh-cw' },
  { id: 'ecoponto', nome: 'Ecopontos Municipais', cor: '#22c55e', icone: 'map-pin' }
];

export async function getPoints(approvedOnly = true) {
  try {
    const q = approvedOnly 
      ? query(collection(db, 'collectionPoints'), where('approved', '==', true))
      : collection(db, 'collectionPoints');
      
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erro ao buscar pontos", error);
    return [];
  }
}

export async function addPoint(data) {
  try {
    const docRef = await addDoc(collection(db, 'collectionPoints'), {
      ...data,
      approved: false, // Requer aprovação por padrão
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Erro ao adicionar ponto", error);
    return { success: false, error };
  }
}

export async function updatePointStatus(id, approved) {
  try {
    const pointRef = doc(db, 'collectionPoints', id);
    await updateDoc(pointRef, { approved });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar ponto", error);
    return { success: false, error };
  }
}
