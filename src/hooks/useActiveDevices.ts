"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

export interface Device {
  id: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  location: string;
  lastAccessed: string;
  lastAccessedRaw: Date;
  isCurrent: boolean;
  ip?: string;
  userAgent?: string;
}

export function useActiveDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect device type from user agent
  const getDeviceType = (userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) return 'mobile';
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'tablet';
    if (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux')) return 'desktop';
    return 'unknown';
  };

  // Get location from API
  const getLocation = async (): Promise<string> => {
    try {
      const response = await fetch('/api/get-location');
      if (!response.ok) throw new Error('Failed to fetch location');
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      const { city, region, country } = data.location;
      return `${city}, ${region} (${country})`;
    } catch (error) {
      console.error('Location fetch error:', error);
      return 'Unknown Location';
    }
  };

  // Register current device session
  const registerCurrentDevice = async () => {
    if (!auth.currentUser) return;

    try {
      const location = await getLocation();
      const deviceType = getDeviceType(navigator.userAgent);
      const userAgent = navigator.userAgent;
      
      // Create a device ID from browser fingerprint
      const deviceId = btoa(`${navigator.userAgent}-${new Date().toDateString()}`).slice(0, 20);

      const deviceData = {
        userId: auth.currentUser.uid,
        deviceId,
        type: deviceType,
        location,
        userAgent,
        lastAccessed: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      // Store in Firestore under user's devices subcollection
      await setDoc(
        doc(db, 'users', auth.currentUser.uid, 'devices', deviceId),
        deviceData
      );

      // Also store session ID in localStorage for quick access
      localStorage.setItem('currentDeviceId', deviceId);
    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  // Fetch all active devices
  const fetchDevices = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const devicesRef = collection(db, 'users', auth.currentUser.uid, 'devices');
      const q = query(devicesRef);
      const snapshot = await getDocs(q);

      const currentDeviceId = localStorage.getItem('currentDeviceId');
      const devicesList: Device[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const lastAccessedDate = data.lastAccessed?.toDate() || new Date();
        
        // Format "last accessed" time
        const now = new Date();
        const diff = now.getTime() - lastAccessedDate.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        let lastAccessedStr = 'Just now';
        if (minutes > 0) lastAccessedStr = `${minutes}m ago`;
        if (hours > 0) lastAccessedStr = `${hours}h ago`;
        if (days > 0) lastAccessedStr = `${days}d ago`;

        devicesList.push({
          id: doc.id,
          type: data.type || 'unknown',
          location: data.location || 'Unknown Location',
          lastAccessed: lastAccessedStr,
          lastAccessedRaw: lastAccessedDate,
          isCurrent: doc.id === currentDeviceId,
          ip: data.ip,
          userAgent: data.userAgent,
        });
      });

      // Sort by last accessed (newest first)
      devicesList.sort((a, b) => b.lastAccessedRaw.getTime() - a.lastAccessedRaw.getTime());

      setDevices(devicesList);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError(err.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  // Revoke a device session
  const revokeDevice = async (deviceId: string) => {
    if (!auth.currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'devices', deviceId));
      
      // Update local state
      setDevices(devices.filter(d => d.id !== deviceId));
    } catch (error: any) {
      console.error('Error revoking device:', error);
      setError(error.message || 'Failed to revoke device');
      throw error;
    }
  };

  // Register device on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        registerCurrentDevice();
        fetchDevices();
      } else {
        setDevices([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Refresh devices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (auth.currentUser) {
        fetchDevices();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    devices,
    loading,
    error,
    fetchDevices,
    revokeDevice,
    registerCurrentDevice,
  };
}
