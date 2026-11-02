"use client";

import { useCallback, useState } from "react";
import { MAX_PRODUCT_SPECIFICATIONS, ProductSpecificationValidationError, readProductSpecifications, validateProductSpecifications, type ProductSpecification, type SpecificationIssue } from "@/lib/productSpecifications";

export type SpecificationDraft = ProductSpecification & { id: string };

export function useProductSpecifications() {
  const [rows, setRows] = useState<SpecificationDraft[]>([]);
  const [issues, setIssues] = useState<SpecificationIssue[]>([]);
  const setStoredSpecifications = useCallback((value: unknown) => {
    setRows(readProductSpecifications(value).map(row => ({ ...row, id: crypto.randomUUID() })));
    setIssues([]);
  }, []);
  function update(id: string, field: keyof ProductSpecification, value: string) {
    setRows(previous => previous.map(row => row.id === id ? { ...row, [field]: value } : row));
    setIssues([]);
  }
  function add() {
    setRows(previous => previous.length >= MAX_PRODUCT_SPECIFICATIONS ? previous : [...previous, { id: crypto.randomUUID(), name: "", value: "" }]);
    setIssues([]);
  }
  function remove(id: string) {
    setRows(previous => previous.filter(row => row.id !== id));
    setIssues([]);
  }
  function move(id: string, direction: -1 | 1) {
    setRows(previous => {
      const index = previous.findIndex(row => row.id === id), next = index + direction;
      if (index < 0 || next < 0 || next >= previous.length) return previous;
      const reordered = [...previous];
      [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
      return reordered;
    });
    setIssues([]);
  }
  function prepareForSave() {
    try {
      const result = validateProductSpecifications(rows.map(({ name, value }) => ({ name, value })), true);
      setIssues([]);
      return result;
    } catch (error) {
      if (error instanceof ProductSpecificationValidationError) setIssues(error.issues);
      throw error;
    }
  }
  return { rows, issues, add, update, remove, move, setStoredSpecifications, prepareForSave };
}

export type ProductSpecificationsController = ReturnType<typeof useProductSpecifications>;
