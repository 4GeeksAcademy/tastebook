/**
 * Custom hook for Intersection Observer API
 * Tracks when elements enter/exit the viewport
 * Used for marking messages as read when visible
 */

import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options = {}) => {
    const [entries, setEntries] = useState(new Map());
    const observer = useRef(null);
    const elements = useRef(new Map());

    const defaultOptions = {
        threshold: 0.5, // Element must be 50% visible
        rootMargin: '0px',
        ...options
    };

    // Initialize observer
    useEffect(() => {
        observer.current = new IntersectionObserver((observedEntries) => {
            setEntries(prev => {
                const newEntries = new Map(prev);
                
                observedEntries.forEach(entry => {
                    const elementId = elements.current.get(entry.target);
                    if (elementId) {
                        newEntries.set(elementId, entry);
                    }
                });
                
                return newEntries;
            });
        }, defaultOptions);

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [defaultOptions.threshold, defaultOptions.rootMargin]);

    // Function to observe an element
    const observe = (element, id) => {
        if (!element || !id || !observer.current) return;

        // Store the mapping between element and ID
        elements.current.set(element, id);
        observer.current.observe(element);
    };

    // Function to unobserve an element
    const unobserve = (element, id) => {
        if (!element || !observer.current) return;

        observer.current.unobserve(element);
        elements.current.delete(element);
        
        setEntries(prev => {
            const newEntries = new Map(prev);
            newEntries.delete(id);
            return newEntries;
        });
    };

    // Get visibility status for a specific ID
    const isVisible = (id) => {
        const entry = entries.get(id);
        return entry ? entry.isIntersecting : false;
    };

    // Get all visible IDs
    const visibleIds = Array.from(entries.entries())
        .filter(([_, entry]) => entry.isIntersecting)
        .map(([id, _]) => id);

    return {
        observe,
        unobserve,
        isVisible,
        visibleIds,
        entries
    };
};