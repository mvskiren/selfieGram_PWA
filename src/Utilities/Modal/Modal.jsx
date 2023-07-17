import React from "react";
import ReactDom from "react-dom";

const MODAL_STYLES = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#FFF",
  zIndex: 1000,
  background: "#FFFFFF 0% 0% no-repeat padding-box",
  "box-shadow": "1px 4px 6px #0000003D",
  border: "1px solid #F5F5F5",
  "border-radius": "6px",
  opacity: 1,
  "max-width": "90vw",
};
const MODAL_STYLES2 = {
  position: "fixed",
  top: "50%",
  right: "50%",
  zIndex: 1000,
};
const OVERLAY_STYLES = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, .6)",
  zIndex: 1000,
};

function Modal({ onClose, open, children }) {
  if (!open) return null;

  return ReactDom.createPortal(
    <>
      <div style={OVERLAY_STYLES} />
      <div style={MODAL_STYLES}>
        <div
          style={{
            "font-size": "35px",
            color: "#A5A5A5",
            position: "absolute",
            top: 0,
            right: "0px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "flex-end",
            paddingRight: "10px",
          }}
          onClick={onClose}
        >
          &#x292C;
        </div>
        {children}
      </div>
      <div style={MODAL_STYLES2}>
        {/* <button  onClick={onClose}> */}
        {/* </button> */}
      </div>
    </>,
    document.getElementById("app")
  );
}

export default Modal;
