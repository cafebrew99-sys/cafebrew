package com.cafebrew.controller.dto;

import lombok.Data;

@Data
public class CancellationRequest {
    private String reason;
    private String customReason;
}
