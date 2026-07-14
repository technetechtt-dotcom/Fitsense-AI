package com.fitsense.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.fitsense.ai.ui.theme.FitSenseColors

/**
 * Primary call-to-action button.  Renders a gradient-filled pill with a tight
 * Material 3 ripple to match the brand aesthetic.
 */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
    gradient: Brush = FitSenseColors.ScanGradient,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(50),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent,
            contentColor = FitSenseColors.Surface0,
        ),
        modifier = modifier.height(56.dp),
    ) {
        Row(
            modifier = Modifier
                .background(brush = if (enabled) gradient else Brush.linearGradient(
                    listOf(FitSenseColors.Surface3, FitSenseColors.Surface3),
                ))
                .padding(horizontal = 28.dp)
                .height(56.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (leadingIcon != null) {
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier.size(20.dp),
                    contentAlignment = Alignment.Center,
                ) { leadingIcon() }
            }
            Text(text = text, style = MaterialTheme.typography.titleMedium)
        }
    }
}
