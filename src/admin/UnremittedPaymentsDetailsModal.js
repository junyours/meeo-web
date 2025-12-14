import React from "react";
import { Modal, Descriptions, Tag, Typography, Divider } from "antd";

const { Text } = Typography;

const UnremittedPaymentsDetailsModal = ({ visible, onClose, payment }) => {
  if (!payment) return null;

  const { rawData, type } = payment;

  const headerTagColor = "#1B4F72";

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            Payment Details - {type}
          </span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Review the full breakdown of this unremitted collection.
          </Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={640}
      bodyStyle={{ paddingTop: 12 }}
    >
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Tag
          color={headerTagColor}
          style={{
            borderRadius: 999,
            padding: "2px 12px",
            fontSize: 12,
          }}
        >
          {type} Collection
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Collected on {payment.dateCollected} at {payment.timeCollected}
        </Text>
      </div>

      <Descriptions
        bordered
        column={1}
        size="middle"
        labelStyle={{
          width: 180,
          fontWeight: 500,
          background: "#f9fafb",
        }}
        contentStyle={{
          textAlign: "right",
          fontSize: 13,
        }}
      >
        <Descriptions.Item label="Collector">
          {payment.collector}
        </Descriptions.Item>
        <Descriptions.Item label="Assigned Area">
          <Tag
            color={headerTagColor}
            style={{
              borderRadius: 999,
              padding: "2px 10px",
              fontSize: 12,
            }}
          >
            {type}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Total Collected">
          ₱
          {Number(payment.totalCollected).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Descriptions.Item>
        <Descriptions.Item label="Date Collected">
          {payment.dateCollected}
        </Descriptions.Item>
        <Descriptions.Item label="Time Collected">
          {payment.timeCollected}
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: "16px 0" }} />

      {/* Additional details depending on type */}
      <Descriptions
        title="Additional Details"
        column={1}
        size="small"
        bordered
        labelStyle={{
          width: 180,
          fontWeight: 500,
          background: "#f9fafb",
        }}
        contentStyle={{
          textAlign: "right",
          fontSize: 13,
        }}
      >
        {type === "Market" && (
          <>
            <Descriptions.Item label="Vendor Name">
              {rawData.vendor_name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Stall Number">
              {rawData.stall_number || "N/A"}
            </Descriptions.Item>
          </>
        )}

        {type === "Slaughter" && (
          <>
            <Descriptions.Item label="Customer">
              {rawData.vendor_name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Animal Type">
              {rawData.animal || "N/A"}
            </Descriptions.Item>
          </>
        )}

        {(type === "Wharf" || type === "Motorpool") && (
          <Descriptions.Item label="Vendor Name">
            N/A
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

export default UnremittedPaymentsDetailsModal;
