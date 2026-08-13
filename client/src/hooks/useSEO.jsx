import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title, meta description, 
 * canonical link, and inject JSON-LD schema for SEO and AI/GEO crawler optimization.
 * 
 * @param {Object} seoOptions
 * @param {string} seoOptions.title - Page title in browser tab
 * @param {string} seoOptions.description - Meta description for search engines
 * @param {string} [seoOptions.canonicalUrl] - Canonical URL override
 * @param {Object} [seoOptions.schema] - JSON-LD schema object to inject
 */
export default function useSEO({ title, description, canonicalUrl, schema }) {
  useEffect(() => {
    // 1. Update Document Title
    if (title) {
      document.title = title;
    }

    // 2. Update Meta Description Tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute('content', description);
    }

    // 3. Update Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    const currentUrl = canonicalUrl || window.location.href;
    linkCanonical.setAttribute('href', currentUrl);

    // 4. Inject JSON-LD Schema
    const existingSchema = document.getElementById('dynamic-seo-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    if (schema) {
      const script = document.createElement('script');
      script.id = 'dynamic-seo-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    // Cleanup script tag on unmount
    return () => {
      const schemaToCleanup = document.getElementById('dynamic-seo-schema');
      if (schemaToCleanup) {
        schemaToCleanup.remove();
      }
    };
  }, [title, description, canonicalUrl, schema]);
}
