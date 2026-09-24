// SSO Gateway page — shown at /
// Wraps Frame00_SSOGateway so it can call useNavigate on portal selection.
import React from "react";
import { useNavigate } from "react-router";
import { Frame00_SSOGateway } from "../components/erp/Frame00_SSOGateway";

export const SSOPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Frame00_SSOGateway
      onPortalSelect={(portal) => {
        if (portal === "teacher") navigate("/teacher");
        else if (portal === "student") navigate("/student");
        else if (portal === "parent") navigate("/parent");
      }}
    />
  );
};
